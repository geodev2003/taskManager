const express = require('express');
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Các route quản lý thông tin người dùng
 * Tất cả đều yêu cầu Access Token hợp lệ qua authMiddleware
 */

// Lấy thông tin cá nhân của người dùng đang đăng nhập
router.get('/me', authMiddleware, usersController.getProfile);

// Cập nhật thông tin cá nhân (Hàm updateProfile đã thêm vào controller)
router.patch('/me', authMiddleware, usersController.updateProfile);

module.exports = router;