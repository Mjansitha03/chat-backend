import express from "express";
import upload from "../Middlewares/uploadMiddleware.js";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadAvatar,
  deleteUploadedFile,
} from "../Controllers/uploadController.js";
import { protect } from "../Middlewares/authMiddleware.js";

const router = express.Router();



router.post("/single", protect, upload.single("file"), uploadSingleFile);


router.post("/multiple", protect, upload.array("files", 5), uploadMultipleFiles);


router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);


router.delete("/delete", protect, deleteUploadedFile);

export default router;


