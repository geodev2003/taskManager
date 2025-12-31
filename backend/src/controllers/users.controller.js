const usersService = require('../services/users.service');
const AppError = require('../utils/appError');

/**
 * Lấy thông tin cá nhân của người dùng đang đăng nhập
 * GET /users/me
 */
async function getProfile(req, res, next) {
    try {
        // Dữ liệu người dùng đã được authMiddleware gán vào req.user
        const userId = req.user.uId;

        if (!userId) {
            throw new AppError("UNAUTHORIZED", "User identity not found in request", 401);
        }

        // Lấy thông tin chi tiết từ service (Service này đã loại bỏ mật khẩu)
        const user = await usersService.getUserById(userId);

        res.status(200).json({
            status: 'success',
            message: 'Get profile success',
            data: {
                user
            }
        });
    } catch (error) {
        // Chuyển lỗi sang errorHandler middleware
        next(error);
    }
}

/**
 * Cập nhật thông tin cá nhân
 * PATCH /users/me
 */
async function updateProfile(req, res, next) {
    try {
        const userId = req.user.uId;
        const updateData = req.body;

        // Chặn không cho cập nhật các trường nhạy cảm nếu có trong body
        delete updateData.uPassword;
        delete updateData.uRole;

        // Bạn có thể triển khai hàm update trong usersService sau này
        // const updatedUser = await usersService.updateUser(userId, updateData);

        res.status(200).json({
            status: 'success',
            message: 'Profile update function is ready to be implemented',
            data: {
                userId,
                updatedFields: Object.keys(updateData)
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProfile,
    updateProfile,
};