const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 phút - cửa sổ thời gian để đếm số lần thử
    max: 5, // Tối đa 5 lần thử trong 3 phút
    handler: (req, res, next) => {
        // Khi vượt quá 5 lần trong 3 phút, chặn 60 giây
        // Tính thời gian còn lại: nếu còn hơn 60s thì chỉ chặn 60s, nếu ít hơn thì chặn đến hết cửa sổ
        const resetTime = req.rateLimit?.resetTime || Date.now() + (3 * 60 * 1000);
        const remainingTime = resetTime - Date.now();
        const blockTime = Math.min(60 * 1000, remainingTime); // Tối đa 60 giây
        const blockSeconds = Math.ceil(blockTime / 1000);
        
        next(new AppError(
            "TOO_MANY_REQUESTS",
            `Too many login attempts. Please try again after ${blockSeconds} seconds.`,
            429
        ));
    },
    standardHeaders: true, // Trả về thông tin giới hạn trong header RateLimit-*
    legacyHeaders: false, // Tắt các header X-RateLimit-* cũ
    // Reset counter khi đăng nhập thành công
    skipSuccessfulRequests: true,
});

module.exports = {
    loginLimiter,
};