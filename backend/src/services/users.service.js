const { pool, sql } = require("../config/db");
const bcrypt = require("bcrypt");
const AppError = require("../utils/appError");

/**
 * Tìm kiếm người dùng bằng Email
 * Hỗ trợ kiểm tra trùng lặp hoặc lấy thông tin đăng nhập
 */
async function getUserByEmail(uEmail) {
  const result = await pool.request()
    .input("uEmail", sql.VarChar, uEmail)
    .query(`
      SELECT uId, uName, uEmail, uPassword, uRole 
      FROM users 
      WHERE uEmail = @uEmail AND uDeleteAt IS NULL
    `);
  return result.recordset[0];
}

/**
 * Tạo người dùng mới
 * Sử dụng cho luồng Register
 */
async function createUser({ uName, uEmail, uPhone, uPassword }) {
  try {
    // 1. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await getUserByEmail(uEmail);
    if (existingUser) {
      throw new AppError(
        "EMAIL_ALREADY_EXISTS", 
        "Email address is already registered", 
        409
      );
    }

    // 2. Hash mật khẩu bảo mật
    const hashedPassword = await bcrypt.hash(uPassword, 10);

    // 3. Thực hiện lưu vào Database
    const result = await pool.request()
      .input("uName", sql.NVarChar, uName) // Hỗ trợ tiếng Việt có dấu
      .input("uEmail", sql.VarChar, uEmail)
      .input("uPhone", sql.VarChar, uPhone)
      .input("uPassword", sql.VarChar, hashedPassword)
      .query(`
        INSERT INTO users (uName, uEmail, uPhone, uPassword, uRole)
        OUTPUT INSERTED.uId
        VALUES (@uName, @uEmail, @uPhone, @uPassword, 'user')
      `);

    return result.recordset[0].uId;

  } catch (error) {
    // Xử lý lỗi trùng lặp key từ SQL Server (Error 2627)
    if (error.number === 2627) {
      throw new AppError("EMAIL_ALREADY_EXISTS", "Email already exists", 409);
    }

    // Nếu là lỗi chúng ta chủ động throw thì gửi tiếp đi
    if (error instanceof AppError) throw error;

    // Lỗi không xác định khác
    throw new AppError("USER_CREATE_FAILED", "An error occurred while creating user", 500);
  }
}

/**
 * Lấy thông tin chi tiết người dùng bằng ID
 * Loại bỏ password để đảm bảo an toàn dữ liệu trả về
 */
async function getUserById(uId) {
  const result = await pool.request()
    .input("uId", sql.Int, uId)
    .query(`
      SELECT uId, uName, uEmail, uPhone, uRole, uCreateAt
      FROM users
      WHERE uId = @uId AND uDeleteAt IS NULL
    `);

  const user = result.recordset[0];

  if (!user) {
    throw new AppError("USER_NOT_FOUND", "User not found or has been deleted", 404);
  }

  return user;
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail
};