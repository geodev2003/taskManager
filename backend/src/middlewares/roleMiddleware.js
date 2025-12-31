const AppError = require("../utils/appError");

function requireRole(...roles) {
    return (req, res, next) => {
        if(!req.user) {
            return next(
                new AppError(
                    "UNAUTHORIZED",
                    "Unauthorized",
                    401,
                )
            );
        }

        if(!roles.includes(req.user.uRole)) {
            return next(
                new AppError(
                    "FORBIDDEN",
                    "You do not have permission",
                    403,
                )
            );
        }

        next();
    };
}

module.exports = requireRole;