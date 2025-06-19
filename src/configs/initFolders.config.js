import fs from "fs";
import path from "path";

const uploadDir = path.join("uploads");

export const initUploadFolder = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("📁 Carpeta 'uploads' creada");
  }
};
