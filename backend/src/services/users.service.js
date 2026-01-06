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
      SELECT uId, uName, uEmail, uPhone, uRole, uAddress, uCreateAt
      FROM users
      WHERE uId = @uId AND uDeleteAt IS NULL
    `);

  const user = result.recordset[0];

  if (!user) {
    throw new AppError("USER_NOT_FOUND", "User not found or has been deleted", 404);
  }

  return user;
}


async function updateUser(userId, updateData) {
  try {
    // Kiểm tra user tồn tại
    const existingUser = await getUserById(userId);

    // Xây dựng câu query động dựa trên dữ liệu cần update
    const updateFields = [];
    const request = pool.request().input("uId", sql.Int, userId);

    // Cập nhật tên
    if (updateData.uName !== undefined) {
      updateFields.push("uName = @uName");
      request.input("uName", sql.NVarChar, updateData.uName);
    }

    // Cập nhật số điện thoại
    if (updateData.uPhone !== undefined) {
      updateFields.push("uPhone = @uPhone");
      request.input("uPhone", sql.VarChar, updateData.uPhone);
    }

    // Cập nhật địa chỉ
    if (updateData.uAddress !== undefined) {
      updateFields.push("uAddress = @uAddress");
      request.input("uAddress", sql.NVarChar, updateData.uAddress);
    }

    // Cập nhật mật khẩu (nếu có)
    if (updateData.uPassword) {
      const hashedPassword = await bcrypt.hash(updateData.uPassword, 10);
      updateFields.push("uPassword = @uPassword");
      request.input("uPassword", sql.VarChar, hashedPassword);
    }

    // Nếu không có trường nào để update
    if (updateFields.length === 0) {
      return existingUser;
    }

    // Thực hiện update
    await request.query(`
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE uId = @uId AND uDeleteAt IS NULL
    `);

    // Lấy thông tin user sau khi update (không bao gồm password)
    const updatedUser = await getUserById(userId);
    return updatedUser;

  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("USER_UPDATE_FAILED", "An error occurred while updating user", 500);
  }
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser
};