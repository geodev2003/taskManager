const { sql, pool } = require("../config/db");
const bcrypt = require("bcrypt");
const AppError = require("../utils/appError");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

/**
 * Xử lý đăng nhập người dùng
 */
async function loginUser({ uEmail, uPassword }) {
    // 1. Tìm user trong database
    const result = await pool.request()
        .input("uEmail", sql.VarChar, uEmail)
        .query(`
            SELECT uId, uEmail, uPassword, uRole, uName 
            FROM users 
            WHERE uEmail = @uEmail 
              AND uDeleteAt IS NULL
        `);

    const user = result.recordset[0];

    // 2. Kiểm tra user tồn tại
    if (!user) {
        throw new AppError("USER_NOT_FOUND", "User not found", 404);
    }

    // 3. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(uPassword, user.uPassword);
    if (!isMatch) {
        throw new AppError("INVALID_PASSWORD", "Invalid password", 401);
    }

    // 4. Tạo bộ đôi Token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5. Lưu Refresh Token vào database để quản lý (chống fake/thu hồi)
    // Mặc định hết hạn sau 7 ngày đồng bộ với DB (DATEADD(day, 7, GETDATE()))
    await pool.request()
        .input("uId", sql.Int, user.uId)
        .input("token", sql.NVarChar, refreshToken)
        .query(`
            INSERT INTO refresh_tokens (uId, token, expiresAt)
            VALUES (@uId, @token, DATEADD(day, 7, GETDATE()))
        `);

    // 6. Xóa mật khẩu trước khi trả về dữ liệu
    delete user.uPassword;

    return {
        accessToken,
        refreshToken,
        user
    };
}

/**
 * Kiểm tra Refresh Token còn hiệu lực trong Database không
 * (Hàm này cực kỳ quan trọng cho auth.controller.js)
 */
async function verifyRefreshToken(uId, token) {
    const result = await pool.request()
        .input("uId", sql.Int, uId)
        .input("token", sql.NVarChar, token)
        .query(`
            SELECT 1 FROM refresh_tokens 
            WHERE uId = @uId 
              AND token = @token 
              AND revokedAt IS NULL 
              AND expiresAt > GETDATE()
        `);
    
    // Trả về true nếu tìm thấy token hợp lệ
    return result.recordset.length > 0;
}

/**
 * Xử lý đăng xuất (Vô hiệu hóa Refresh Token)
 */
async function logout(refreshToken) {
    if (!refreshToken) {
        throw new AppError("REFRESH_TOKEN_REQUIRED", "Refresh token is required", 400);
    }

    await pool.request()
        .input("token", sql.NVarChar, refreshToken)
        .query(`
            UPDATE refresh_tokens
            SET revokedAt = GETDATE()
            WHERE token = @token
              AND revokedAt IS NULL
        `);

    return { message: "Logged out successfully" };
}

module.exports = {
    loginUser,
    logout,
    verifyRefreshToken
};