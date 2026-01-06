const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { sql, pool, poolConnection } = require('./src/config/db');

const requestId = require('./src/middlewares/requestId');
const errorHandler = require('./src/middlewares/errorHandler');

const usersRouter = require('./src/routes/users.router');
const authRouter = require('./src/routes/auth.router');
const tasksRouter = require('./src/routes/tasks.router');
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

app.use(requestId);

// Đảm bảo UTF-8 encoding cho tất cả responses
app.use((req, res, next) => {
  // Chỉ set header cho JSON responses
  const originalJson = res.json;
  res.json = function (data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson.call(this, data);
  };
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use(errorHandler);

module.exports = app;

