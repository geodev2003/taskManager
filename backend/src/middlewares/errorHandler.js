const AppError = require("../utils/appError");

module.exports = (err, req, res, next) => {
  let status = err.statusCode || 500;

  if (err.code === "VALIDATION_ERROR") status = 400;
  if (err.code === "EMAIL_ALREADY_EXISTS") status = 409;

  // Log error để debug (chỉ trong development)
  if (status === 500) {
    console.error('Server Error:', {
      code: err.code,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      requestId: req.requestId,
      url: req.url,
      method: req.method
    });
  }

  res.status(status).json({
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Unexpected error occurred",
    details: err.details || undefined,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
};
