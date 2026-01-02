function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next({
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data; // Nếu validation passes, set the validated data to req.body
    next();
  };
}

module.exports = validate;
