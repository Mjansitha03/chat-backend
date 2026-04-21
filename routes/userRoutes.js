import express from "express";
import {
  getMyProfile,
  getAllUsers,
  getUserById,
  updateMyProfile,
  updateMyAvatar,
  changePassword,
  toggleBlockUser,
  searchUsers,
} from "../Controllers/userController.js";
import { protect } from "../Middlewares/authMiddleware.js";
import upload from "../Middlewares/uploadMiddleware.js";

const router = express.Router();



router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.put("/me/avatar", protect, upload.single("avatar"), updateMyAvatar);
router.put("/me/change-password", protect, changePassword);


router.get("/", protect, getAllUsers);


router.get("/search", protect, searchUsers);


router.put("/:userId/block", protect, toggleBlockUser);


router.get("/:userId", protect, getUserById);

export default router;




