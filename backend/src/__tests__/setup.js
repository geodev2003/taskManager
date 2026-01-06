/**
 * Test setup file
 * Chạy trước tất cả các tests để đảm bảo DB connection
 * File này được load tự động bởi Jest (setupFilesAfterEnv)
 */
// Set NODE_ENV trước khi require db.js
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { pool } = require('../config/db');

// Đảm bảo DB connection sẵn sàng trước khi tests chạy
beforeAll(async () => {
  try {
    // Kiểm tra xem connection đã được mở chưa
    if (!pool.connected) {
      await pool.connect();
      console.log('✅ Test DB connected');
    }
  } catch (err) {
    console.error('❌ Test DB connection failed:', err);
    // Không throw error ở đây để tránh làm crash toàn bộ test suite
    // Các test cases sẽ tự handle connection errors
  }
}, 30000); // Timeout 30s cho connection

// KHÔNG đóng connection ở đây
// Jest sẽ tự động cleanup khi tất cả tests chạy xong với forceExit: true
// Việc đóng connection sớm sẽ làm các tests sau đó fail

