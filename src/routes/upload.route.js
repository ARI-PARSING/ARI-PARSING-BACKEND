import { Router } from "express";
import { multerMiddleware } from "../middlewares/multer.middleware.js";
import { uploadFile } from "../controllers/upload.controller.js";
import { uploadValidator } from "../validators/upload.validator.js";
import { validationMiddleware } from "../middlewares/validator.middleware.js";

const uploadRoute = Router();

uploadRoute.post(
  "/send",
  multerMiddleware,
  uploadValidator,
  validationMiddleware,
  uploadFile
);

export default uploadRoute;
