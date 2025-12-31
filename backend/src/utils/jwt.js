const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    { uId: user.uId, uRole: user.uRole },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { uId: user.uId, uRole: user.uRole },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
