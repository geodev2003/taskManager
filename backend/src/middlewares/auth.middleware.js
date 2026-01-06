const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

function authMiddleware(req, res, next) {
    try {
        // console.log('Auth Middleware - Path:', req.path);
        // console.log('Auth Middleware - Headers:', req.headers.authorization);
        
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.error('No valid authorization header');
            throw new AppError(
                "UNAUTHORIZED",
                "Access token is missing or invalid format",
                401,
            );
        }

        const token = authHeader.split(" ")[1];
        
        if (!token) {
            console.error('Token is empty');
            throw new AppError(
                "UNAUTHORIZED",
                "Access token is empty",
                401,
            );
        }

        // console.log('Token received (first 20 chars):', token.substring(0, 20));
        // console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // console.log('Token verified successfully:', { uId: decoded.uId, uRole: decoded.uRole });
       
        req.user = {
            uId: decoded.uId,
            uRole: decoded.uRole,
        };

        next();
    } catch (error) {
        // console.error('Auth Middleware Error:', error.message);
        
        if(error.name === "TokenExpiredError") {
            return next(new AppError(
                "TOKEN_EXPIRED",
                "Token has expired",
                401,
            ));
        }

        if(error.name === "JsonWebTokenError") {
            return next(new AppError(
                "TOKEN_INVALID",
                "Token is invalid",
                401,
                error.message
            ));
        }

        // Nếu là AppError thì throw tiếp
        if (error instanceof AppError) {
            return next(error);
        }

        // Lỗi không xác định
        next(new AppError(
            "UNAUTHORIZED",
            "Authentication failed",
            401
        ));
    }
}

module.exports = authMiddleware;