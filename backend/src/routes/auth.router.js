const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { loginSchema, registerUserSchema } = require('../validators/auth.schema');

/**
 * Các route dành cho xác thực (Authentication)
 */

// Đăng ký tài khoản mới
router.post('/register', validate(registerUserSchema), authController.registerUser);

// Đăng nhập hệ thống
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// Làm mới Access Token bằng Refresh Token
router.post('/refresh', authController.refreshToken);

// Đăng xuất và vô hiệu hóa Refresh Token
router.post('/logout', authController.logout);

module.exports = router;