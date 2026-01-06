const request = require('supertest');
const app = require('../../app');
const { pool, sql } = require('../config/db');
const {
  createTestUser,
  deleteTestUser,
  deleteTestTask,
  deleteIdempotencyKey,
  cleanupTestData,
  getTaskFromDB,
  getAuditsFromDB
} = require('./helpers/testHelpers');

describe('Tasks API Tests', () => {
  let testUser;
  let authToken;
  let createdTaskId;

  beforeAll(async () => {
    // Đảm bảo connection đang mở
    if (!pool.connected) {
      await pool.connect();
    }
    
    await cleanupTestData();
    
    // Tạo user test và lấy token
    testUser = await createTestUser({
      uEmail: 'taskuser@test.com',
      uPassword: 'Test123!@#'
    });

    // Login để lấy token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        uEmail: 'taskuser@test.com',
        uPassword: 'Test123!@#'
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/tasks - Create Task', () => {
    it('should create a task successfully with idempotency key', async () => {
      const idempotencyKey = `test-key-${Date.now()}`;
      const taskData = {
        tName: 'Test Task',
        tContent: 'This is a test task content',
        tRimderAt: null,
        tDateExpire: null
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tId');
      expect(response.body.data).toHaveProperty('tName', 'Test Task');
      expect(response.body.data).toHaveProperty('tStatus', 'todo');
      expect(response.body.data).toHaveProperty('tVersion', 1);

      createdTaskId = response.body.data.tId;

      // Verify task exists in DB
      const taskInDB = await getTaskFromDB(createdTaskId);
      expect(taskInDB).toBeTruthy();
      expect(taskInDB.tName).toBe('Test Task');
      expect(taskInDB.tVersion).toBe(1);

      // Verify audit log was created
      const audits = await getAuditsFromDB(createdTaskId);
      expect(audits.length).toBeGreaterThan(0);
      const createAudit = audits.find(a => a.taAction === 'CREATE');
      expect(createAudit).toBeTruthy();
      expect(createAudit.taAfterData).toBeTruthy();
    });

    it('should return same result when using same idempotency key (idempotency test)', async () => {
      const idempotencyKey = `idempotency-test-${Date.now()}`;
      const taskData = {
        tName: 'Idempotency Test Task',
        tContent: 'Testing idempotency',
        tRimderAt: null,
        tDateExpire: null
      };

      // First request
      const firstResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(taskData)
        .expect(201);

      const firstTaskId = firstResponse.body.data.tId;

      // Second request with same key
      const secondResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(taskData)
        .expect(201);

      // Should return same task ID
      expect(secondResponse.body.data.tId).toBe(firstTaskId);
      expect(secondResponse.body.data.tName).toBe(firstResponse.body.data.tName);

      // Verify only one task was created in DB
      const taskCount = await pool.request()
        .input('tName', sql.VarChar, 'Idempotency Test Task')
        .query('SELECT COUNT(*) as count FROM task WHERE tName = @tName');
      
      expect(taskCount.recordset[0].count).toBe(1);

      // Cleanup
      await deleteTestTask(firstTaskId);
      await deleteIdempotencyKey(testUser.uId, idempotencyKey);
    });

    it('should return 400 when idempotency key is missing', async () => {
      const taskData = {
        tName: 'Task Without Key',
        tContent: 'This should fail'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'IDEMPOTENCY_KEY_REQUIRED');
    });

    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ tName: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('GET /api/tasks - Get Tasks List', () => {
    beforeEach(async () => {
      // Tạo một số tasks test
      const idempotencyKey1 = `list-test-1-${Date.now()}`;
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey1)
        .send({
          tName: 'Task A',
          tContent: 'Content A'
        });

      const idempotencyKey2 = `list-test-2-${Date.now()}`;
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey2)
        .send({
          tName: 'Task B',
          tContent: 'Content B'
        });
    });

    it('should get tasks list with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
    });

    it('should search tasks by name', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Task A')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.tasks.length).toBeGreaterThan(0);
      expect(response.body.data.tasks[0].tName).toContain('Task A');
    });
  });

  describe('PUT /api/tasks/:id - Update Task', () => {
    let updateTaskId;
    let initialVersion;

    beforeEach(async () => {
      // Tạo task để update
      const idempotencyKey = `update-test-${Date.now()}`;
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          tName: 'Task to Update',
          tContent: 'Initial content'
        });

      updateTaskId = createResponse.body.data.tId;
      initialVersion = createResponse.body.data.tVersion;
    });

    it('should update task successfully with correct version', async () => {
      const updateData = {
        tName: 'Updated Task Name',
        version: initialVersion
      };

      const response = await request(app)
        .put(`/api/tasks/${updateTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Task updated successfully');
      expect(response.body.data).toHaveProperty('tName', 'Updated Task Name');
      expect(response.body.data.tVersion).toBe(initialVersion + 1);

      // Verify in DB
      const taskInDB = await getTaskFromDB(updateTaskId);
      expect(taskInDB.tName).toBe('Updated Task Name');
      expect(taskInDB.tVersion).toBe(initialVersion + 1);

      // Verify audit log
      const audits = await getAuditsFromDB(updateTaskId);
      const updateAudit = audits.find(a => a.taAction === 'UPDATE');
      expect(updateAudit).toBeTruthy();
      expect(updateAudit.taBeforeData).toBeTruthy();
      expect(updateAudit.taAfterData).toBeTruthy();
    });

    it('should return 409 when version mismatch (version conflict test)', async () => {
      // Update task lần đầu để tăng version
      await request(app)
        .put(`/api/tasks/${updateTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tName: 'First Update',
          version: initialVersion
        })
        .expect(200);

      // Thử update với version cũ (should fail)
      const response = await request(app)
        .put(`/api/tasks/${updateTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tName: 'Second Update',
          version: initialVersion // Version cũ, đã bị tăng lên
        })
        .expect(409);

      expect(response.body).toHaveProperty('code', 'TASK_VERSION_CONFLICT');
      expect(response.body.message).toContain('changed');
    });

    it('should return 400 when version is missing', async () => {
      const response = await request(app)
        .put(`/api/tasks/${updateTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tName: 'Update without version'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VERSION_REQUIRED');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tName: 'Update',
          version: 1
        })
        .expect(404);

      expect(response.body).toHaveProperty('code', 'TASK_NOT_FOUND');
    });
  });

  describe('DELETE /api/tasks/:id - Soft Delete', () => {
    let deleteTaskId;

    beforeEach(async () => {
      // Tạo task để delete
      const idempotencyKey = `delete-test-${Date.now()}`;
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          tName: 'Task to Delete',
          tContent: 'Will be deleted'
        });

      deleteTaskId = createResponse.body.data.tId;
    });

    it('should soft delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${deleteTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      // Verify task is soft deleted (has tDeleteAt)
      const taskInDB = await getTaskFromDB(deleteTaskId);
      expect(taskInDB.tDeleteAt).toBeTruthy();
    });

    it('should not return soft deleted task in list (soft delete test)', async () => {
      // Soft delete task
      await request(app)
        .delete(`/api/tasks/${deleteTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get tasks list
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deleted task is not in list
      const deletedTaskInList = response.body.data.tasks.find(
        t => t.tId === deleteTaskId
      );
      expect(deletedTaskInList).toBeUndefined();
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('code', 'TASK_NOT_FOUND');
    });
  });

  describe('POST /api/tasks/:id/restore - Restore Task', () => {
    let restoreTaskId;

    beforeEach(async () => {
      // Tạo và soft delete task
      const idempotencyKey = `restore-test-${Date.now()}`;
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          tName: 'Task to Restore',
          tContent: 'Will be restored'
        });

      restoreTaskId = createResponse.body.data.tId;

      // Soft delete
      await request(app)
        .delete(`/api/tasks/${restoreTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should restore soft deleted task successfully', async () => {
      const response = await request(app)
        .post(`/api/tasks/${restoreTaskId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data.message).toContain('restored');

      // Verify task is restored (tDeleteAt is null)
      const taskInDB = await getTaskFromDB(restoreTaskId);
      expect(taskInDB.tDeleteAt).toBeNull();
    });
  });

  describe('GET /api/tasks/:id/audits - Get Task Audits', () => {
    let auditTaskId;

    beforeEach(async () => {
      // Tạo task và thực hiện một số thao tác để tạo audit logs
      const idempotencyKey = `audit-test-${Date.now()}`;
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          tName: 'Audit Test Task',
          tContent: 'For audit testing'
        });

      auditTaskId = createResponse.body.data.tId;

      // Update task để tạo audit log
      await request(app)
        .put(`/api/tasks/${auditTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tName: 'Updated for Audit',
          version: 1
        });
    });

    it('should get task audits successfully', async () => {
      const response = await request(app)
        .get(`/api/tasks/${auditTaskId}/audits`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify audit structure
      const audit = response.body.data[0];
      expect(audit).toHaveProperty('taAction');
      expect(audit).toHaveProperty('taCreateAt');
    });

    it('should return 403 when accessing other user\'s task audits', async () => {
      // Tạo user khác
      const otherUser = await createTestUser({
        uEmail: 'otheruser@test.com',
        uPassword: 'Test123!@#'
      });

      const otherUserLogin = await request(app)
        .post('/api/auth/login')
        .send({
          uEmail: 'otheruser@test.com',
          uPassword: 'Test123!@#'
        });

      const otherUserToken = otherUserLogin.body.data.accessToken;

      // Thử access audit của task không phải của mình
      const response = await request(app)
        .get(`/api/tasks/${auditTaskId}/audits`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('code', 'FORBIDDEN');

      // Cleanup
      await deleteTestUser(otherUser.uId);
    });
  });
});

