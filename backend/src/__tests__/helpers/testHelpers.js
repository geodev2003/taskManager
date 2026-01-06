const { pool, sql } = require('../../config/db');
const bcrypt = require('bcrypt');

/**
 * Helper để tạo user test trong DB
 */
async function createTestUser({ uName = 'Test User', uEmail, uPassword = 'Test123!@#', uPhone = '0123456789' }) {
  // Đảm bảo connection đang mở
  if (!pool.connected) {
    await pool.connect();
  }

  const hashedPassword = await bcrypt.hash(uPassword, 10);
  
  const result = await pool.request()
    .input('uName', sql.NVarChar, uName)
    .input('uEmail', sql.VarChar, uEmail)
    .input('uPhone', sql.VarChar, uPhone)
    .input('uPassword', sql.VarChar, hashedPassword)
    .query(`
      INSERT INTO users (uName, uEmail, uPhone, uPassword, uRole)
      OUTPUT INSERTED.uId, INSERTED.uEmail, INSERTED.uRole
      VALUES (@uName, @uEmail, @uPhone, @uPassword, 'user')
    `);
  
  return result.recordset[0];
}

/**
 * Helper để xóa user test
 * Xóa refresh_tokens trước để tránh foreign key constraint
 */
async function deleteTestUser(uId) {
  if (!pool.connected) {
    await pool.connect();
  }
  
  try {
    // Xóa refresh_tokens trước (foreign key constraint)
    await pool.request()
      .input('uId', sql.Int, uId)
      .query('DELETE FROM refresh_tokens WHERE uId = @uId');
    
    // Sau đó xóa user
    await pool.request()
      .input('uId', sql.Int, uId)
      .query('DELETE FROM users WHERE uId = @uId');
  } catch (err) {
    // Ignore errors nếu user không tồn tại
  }
}

/**
 * Helper để xóa task test
 * Xóa taskDetails trước để tránh foreign key constraint
 */
async function deleteTestTask(tId) {
  if (!pool.connected) {
    await pool.connect();
  }
  
  try {
    // Xóa taskDetails trước (foreign key constraint)
    await pool.request()
      .input('tId', sql.Int, tId)
      .query('DELETE FROM taskDetails WHERE tId = @tId');
    
    // Sau đó xóa task
    await pool.request()
      .input('tId', sql.Int, tId)
      .query('DELETE FROM task WHERE tId = @tId');
  } catch (err) {
    // Ignore errors nếu task không tồn tại
  }
}

/**
 * Helper để xóa idempotency key test
 */
async function deleteIdempotencyKey(uId, key) {
  await pool.request()
    .input('uId', sql.Int, uId)
    .input('key', sql.VarChar, key)
    .query('DELETE FROM idempotency_keys WHERE uId = @uId AND ikKey = @key');
}

/**
 * Helper để cleanup tất cả test data
 */
async function cleanupTestData() {
  try {
    // Đảm bảo connection đang mở
    if (!pool.connected) {
      await pool.connect();
    }

    // Xóa theo thứ tự để tránh foreign key constraint
    // Wrap trong try-catch để không fail nếu table không tồn tại
    try {
      await pool.request().query('DELETE FROM taskAudits');
    } catch (err) {
      // Ignore errors
    }
    
    try {
      await pool.request().query('DELETE FROM taskDetails');
    } catch (err) {
      // Ignore errors
    }
    
    try {
      await pool.request().query('DELETE FROM task');
    } catch (err) {
      // Ignore errors
    }
    
    try {
      await pool.request().query('DELETE FROM idempotency_keys');
    } catch (err) {
      // Ignore errors
    }
    
    try {
      await pool.request().query('DELETE FROM refresh_tokens');
    } catch (err) {
      // Ignore errors
    }
    
    try {
      await pool.request().query('DELETE FROM users');
    } catch (err) {
      // Ignore errors
    }
  } catch (err) {
    // Log nhưng không throw để không làm crash tests
    console.warn('Warning: Cleanup failed:', err.message);
  }
}

/**
 * Helper để lấy task từ DB
 */
async function getTaskFromDB(tId) {
  if (!pool.connected) {
    await pool.connect();
  }
  
  const result = await pool.request()
    .input('tId', sql.Int, tId)
    .query('SELECT * FROM task WHERE tId = @tId');
  
  return result.recordset[0];
}

/**
 * Helper để lấy audit từ DB
 */
async function getAuditsFromDB(tId) {
  if (!pool.connected) {
    await pool.connect();
  }
  
  const result = await pool.request()
    .input('tId', sql.Int, tId)
    .query(`
      SELECT taAction, taBeforeData, taAfterData, taCreateAt
      FROM taskAudits
      WHERE tId = @tId
      ORDER BY taCreateAt DESC
    `);
  
  return result.recordset;
}

module.exports = {
  createTestUser,
  deleteTestUser,
  deleteTestTask,
  deleteIdempotencyKey,
  cleanupTestData,
  getTaskFromDB,
  getAuditsFromDB
};

