const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // Tối đa 5 lần thử
    handler: (req, res, next) => {
        next(new AppError(
            "TOO_MANY_REQUESTS",
            "Too many requests, please try again later.",
            429
        ));
    },
    standardHeaders: true, // Trả về thông tin giới hạn trong header RateLimit-*
    legacyHeaders: false, // Tắt các header X-RateLimit-* cũ
});

module.exports = {
    loginLimiter,
};