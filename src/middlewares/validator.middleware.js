import { validationResult } from "express-validator";

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorHandler = errors.array().map((e) => e.msg);
    return res.status(400).json({
      message: "Validation failed",
      errors: errorHandler,
    });
  }
  next();
};

export { validationMiddleware };
