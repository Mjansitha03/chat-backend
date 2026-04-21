import express from "express";
import {
  signup,
  signin,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  getMe,
} from "../Controllers/authController.js";
import { protect } from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:id/:token", verifyResetToken);
router.post("/reset-password/:id/:token", resetPassword);

// Protected Routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;



