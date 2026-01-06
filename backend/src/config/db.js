const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    // Đảm bảo hỗ trợ Unicode
    useUTC: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const pool = new sql.ConnectionPool(config);

// Chỉ tự động connect khi không phải test environment
// Trong test, connection sẽ được quản lý bởi setup.js
if (process.env.NODE_ENV !== 'test') {
  pool.connect()
    .then(() => console.log('Connected to SQL Server'))
    .catch(err => console.error('SQL Connection Error:', err));
}

module.exports = { sql, pool };
