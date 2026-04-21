import asyncHandler from "../Utils/asyncHandler.js";
import ApiResponse from "../Utils/ApiResponse.js";
import User from "../Models/userSchema.js";
import {
  getMyProfileService,
  getUserByIdService,
  getAllUsersService,
  updateMyProfileService,
  updateUserAvatarService,
  changePasswordService,
  toggleBlockUserService,
} from "../Services/userService.js";
import { uploadAvatarService } from "../Services/uploadService.js";

// Get My Profile
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getMyProfileService(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile fetched successfully", user));
});

// Get All Users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsersService({
    currentUserId: req.user._id,
    search: req.query.search || "",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Users fetched successfully", users));
});

// Get User By ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await getUserByIdService(req.params.userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", user));
});

// Update My Profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const updatedUser = await updateMyProfileService({
    userId: req.user._id,
    data: req.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", updatedUser));
});

// Update My Avatar
export const updateMyAvatar = asyncHandler(async (req, res) => {
  const uploadedAvatar = await uploadAvatarService(req.file);

  const updatedUser = await updateUserAvatarService({
    userId: req.user._id,
    avatarData: uploadedAvatar,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully", updatedUser));
});

// Change Password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await changePasswordService({
    userId: req.user._id,
    currentPassword,
    newPassword,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

// Block / Unblock User (future admin use)
export const toggleBlockUser = asyncHandler(async (req, res) => {
  const updatedUser = await toggleBlockUserService({
    userId: req.params.userId,
    isBlocked: req.body.isBlocked,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `User ${updatedUser.isBlocked ? "blocked" : "unblocked"} successfully`,
        updatedUser,
      ),
    );
});

export const searchUsers = asyncHandler(async (req, res) => {
  const query = req.query.query?.trim();

  if (!query) {
    return res.status(200).json(new ApiResponse(200, [], "No query"));
  }

  const searchRegex = new RegExp(query, "i");

  const users = await User.find({
    _id: { $ne: req.user._id }, 
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ],
  }).select("name email phone avatar isOnline");

  console.log("Search results:", users.length);

  res.status(200).json(new ApiResponse(200, users, "Users fetched"));
});



