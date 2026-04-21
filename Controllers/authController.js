import asyncHandler from "../Utils/asyncHandler.js";
import ApiResponse from "../Utils/ApiResponse.js";
import {
  signupService,
  signinService,
  forgotPasswordService,
  verifyResetTokenService,
  resetPasswordService,
  getMeService,
} from "../Services/authService.js";

const cookieOptions = {
  httpOnly: true,
  secure: false, 
  sameSite: "lax", 
  path: "/", 
  // maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Signup
export const signup = asyncHandler(async (req, res) => {
  const data = await signupService(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", data));
});

// Signin
export const signin = asyncHandler(async (req, res) => {
  const data = await signinService(req.body);

  res.cookie("token", data.token, cookieOptions);

  res.status(200).json(new ApiResponse(200, "Login successful", data));
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);

  res.status(200).json(new ApiResponse(200, "Logout successful"));
});

// Forgot Password
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await forgotPasswordService(req.body.email);

  res.status(200).json(new ApiResponse(200, result.message));
});

// Verify Token
export const verifyResetToken = asyncHandler(async (req, res) => {
  const data = await verifyResetTokenService(req.params);

  res.status(200).json(new ApiResponse(200, "Token valid", data));
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await resetPasswordService({
    ...req.params,
    ...req.body,
  });

  res.status(200).json(new ApiResponse(200, result.message));
});

// Get Me
export const getMe = asyncHandler(async (req, res) => {
  const user = await getMeService(req.user._id);

  res.status(200).json(new ApiResponse(200, "User fetched successfully", user));
});



