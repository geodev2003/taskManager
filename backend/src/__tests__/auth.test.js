const request = require('supertest');
const app = require('../../app');
const { pool, sql } = require('../config/db');
const { createTestUser, deleteTestUser, cleanupTestData } = require('./helpers/testHelpers');

describe('Auth API Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Đảm bảo connection đang mở
    if (!pool.connected) {
      await pool.connect();
    }
    
    // Cleanup trước khi test
    await cleanupTestData();
  });

  afterAll(async () => {
    // Cleanup sau khi test
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        uName: 'John Doe',
        uEmail: 'john@test.com',
        uPassword: 'Test123!@#',
        uPhone: '0123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body.data).toHaveProperty('userId');
      expect(typeof response.body.data.userId).toBe('number');

      // Cleanup
      if (response.body.data.userId) {
        await deleteTestUser(response.body.data.userId);
      }
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        uName: 'John Doe',
        uEmail: 'invalid-email',
        uPassword: 'Test123!@#',
        uPhone: '0123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        uName: 'John Doe',
        uEmail: 'john2@test.com',
        uPassword: 'weak',
        uPhone: '0123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      // Tạo user đầu tiên
      testUser = await createTestUser({ uEmail: 'duplicate@test.com' });

      const userData = {
        uName: 'Another User',
        uEmail: 'duplicate@test.com',
        uPassword: 'Test123!@#',
        uPhone: '0987654321'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('code', 'EMAIL_ALREADY_EXISTS');

      // Cleanup
      await deleteTestUser(testUser.uId);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Cleanup user cũ nếu có (tránh duplicate)
      try {
        const existingUser = await pool.request()
          .input('uEmail', sql.VarChar, 'login@test.com')
          .query('SELECT uId FROM users WHERE uEmail = @uEmail');
        
        if (existingUser.recordset.length > 0) {
          await deleteTestUser(existingUser.recordset[0].uId);
        }
      } catch (err) {
        // Ignore
      }
      
      // Tạo user test trước mỗi test
      testUser = await createTestUser({
        uEmail: 'login@test.com',
        uPassword: 'Test123!@#'
      });
    });

    afterEach(async () => {
      // Cleanup sau mỗi test
      if (testUser && testUser.uId) {
        await deleteTestUser(testUser.uId);
        testUser = null;
      }
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          uEmail: 'login@test.com',
          uPassword: 'Test123!@#'
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('uId');
      expect(response.body.data.user).toHaveProperty('uEmail', 'login@test.com');
      expect(response.body.data.user).not.toHaveProperty('uPassword');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          uEmail: 'notfound@test.com',
          uPassword: 'Test123!@#'
        })
        .expect(404);

      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          uEmail: 'login@test.com',
          uPassword: 'WrongPassword123!@#'
        })
        .expect(401);

      expect(response.body).toHaveProperty('code', 'INVALID_PASSWORD');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          uEmail: 'invalid-email',
          uPassword: 'Test123!@#'
        })
        .expect(400);

      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});

