const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const { generateAccessToken } = require("../utils/jwt");
const authService = require("../services/auth.service");
const usersService = require("../services/users.service");

/**
 * Đăng ký người dùng
 * POST /auth/register
 */
async function registerUser(req, res, next) {
  try {
    // Dữ liệu đã được validate qua middleware validate(registerUserSchema)
    const userId = await usersService.createUser(req.body);

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: { userId },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Đăng nhập
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    const { uEmail, uPassword } = req.body;

    // Gọi service thực hiện login và tạo token
    const result = await authService.loginUser({ uEmail, uPassword });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Làm mới Access Token
 * POST /auth/refresh
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("REFRESH_TOKEN_REQUIRED", "Refresh token is required", 400);
    }

    // 1. Xác thực định dạng và chữ ký của Refresh Token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new AppError("REFRESH_TOKEN_EXPIRED", "Refresh token has expired", 401);
      }
      throw new AppError("INVALID_REFRESH_TOKEN", "Invalid refresh token", 401);
    }

    // 2. Kiểm tra tính hợp lệ của token trong Database (chống revoke/fake)
    const isValid = await authService.verifyRefreshToken(decoded.uId, refreshToken);

    if (!isValid) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token has been revoked or expired", 401);
    }

    // 3. Lấy thông tin User để tạo Access Token mới
    const user = await usersService.getUserById(decoded.uId);

    // 4. Tạo Access Token mới
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      status: "success",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Đăng xuất
 * POST /auth/logout
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("REFRESH_TOKEN_REQUIRED", "Refresh token is required", 400);
    }

    // Vô hiệu hóa token trong DB
    await authService.logout(refreshToken);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerUser,
  login,
  logout,
  refreshToken,
};