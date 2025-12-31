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
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(config);

pool.connect()
  .then(() => console.log('✅ Connected to SQL Server'))
  .catch(err => console.error('❌ SQL Connection Error:', err));

module.exports = { sql, pool };
