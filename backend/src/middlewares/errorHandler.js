const AppError = require("../utils/appError");

module.exports = (err, req, res, next) => {
  let status = err.statusCode || 500;

  if (err.code === "VALIDATION_ERROR") status = 400;
  if (err.code === "EMAIL_ALREADY_EXISTS") status = 409;

  res.status(status).json({
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Unexpected error occurred",
    details: err.details || undefined,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
};
