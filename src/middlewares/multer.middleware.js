import multer from "multer";
import path from "path";
import fs from "fs";
import createHttpError from "http-errors";
import FILE_TYPES from "../utils/constants/fileTypes.constant.js";

const filterFiles = (req, file, cb) => {
  try {
    var ext = file.originalname.split(".").pop().toLowerCase();
    if (
      ext === FILE_TYPES.CSV ||
      ext === FILE_TYPES.JSON ||
      ext === FILE_TYPES.XML ||
      ext === FILE_TYPES.TXT
    ) {
      cb(null, true);
    } else {
      cb(createHttpError(400, "File type not allowed"), false);
    }
  } catch (error) {
    console.error("Error in file filter:", error);
    cb(createHttpError(500, "Internal Server Error"), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const multerMiddleware = multer({
  storage: storage,
  fileFilter: filterFiles,
}).single("file");

export { multerMiddleware };
