import { Router } from "express";
import uploadRoute from "./upload.route.js";

const router = Router();

router.use("/upload", uploadRoute);

export default router;