const { pool, sql } = require("../config/db");
const bcrypt = require("bcrypt");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");

async function createUser(user) {
  try {
    const { uName, uEmail, uPhone, uPassword } = user;

    const salt = 10;
    const hashedPassword = await bcrypt.hash(uPassword, salt);

    const result = await pool
      .request()
      .input("uName", sql.VarChar, uName)
      .input("uEmail", sql.VarChar, uEmail)
      .input("uPhone", sql.VarChar, uPhone)
      .input("uPassword", sql.VarChar, hashedPassword).query(`
            INSERT INTO users (uName, uEmail, uPhone, uPassword)
            OUTPUT INSERTED.uId
            VALUES (@uName, @uEmail, @uPhone, @uPassword);

        `);

    return result.recordset[0].uId;
  } catch (error) {
    if (error.number === 2627) {
      throw new AppError(
        "EMAIL_ALREADY_EXISTS",
        "Email already exists",
        409,
        error.message
      );
    }
    throw new AppError(
      "USER_CREATE_FAILED",
      "Failed to create user",
      500,
      error.message
    );
  }
}

async function loginUser(payload) {
    try {
      const { uEmail, uPassword } = payload;
  
      const result = await pool.request()
        .input('uEmail', sql.VarChar, uEmail)
        .query(`
          SELECT uId, uEmail, uPassword, uRole
          FROM users
          WHERE uEmail = @uEmail AND uDeleteAt IS NULL
        `);
  
      const user = result.recordset[0];
  
      if (!user) {
        throw new AppError(
          'LOGIN_FAILED',
          'Invalid email or password',
          401
        );
      }
  
      const isMatch = await bcrypt.compare(uPassword, user.uPassword);
  
      if (!isMatch) {
        throw new AppError(
          'LOGIN_FAILED',
          'Invalid email or password',
          401
        );
      }
  
      const token = jwt.sign(
        { uId: user.uId, uRole: user.uRole },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
  
      return {
        accessToken: token,
        user: {
          uId: user.uId,
          uEmail: user.uEmail,
          uRole: user.uRole
        }
      };
  
    } catch (error) {
      if (error instanceof AppError) throw error;
  
      throw new AppError(
        'LOGIN_FAILED',
        'Failed to login',
        500,
        error.message
      );
    }
  }
  
module.exports = {
  createUser,
  loginUser,
};
