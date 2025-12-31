const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError(
                "UNAUTHORIZED",
                "Acces token is missing",
                401,
            );
        }

        const token = authHeader.split(" ")[1];
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
        req.user = {
            uId: decoded.uId,
            uRole: decoded.uRole,
        };

        next();
    } catch (error) {
        if(error.name === "TokenExpiredError") {
            throw new AppError(
                "TOKEN_EXPIRED",
                "Token is expired",
                401,
            );
        }

        if(error.name === "JsonWebTokenError") {
            throw new AppError(
                "TOKEN_INVALID",
                "Token is invalid",
                401,
                error.message
            );
        }

        next(error);
    }
}

module.exports = authMiddleware;