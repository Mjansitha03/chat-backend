import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../Models/userSchema.js";
import ApiError from "../Utils/ApiError.js";
import cloudinary from "../Config/cloudinary.js";

// Get My Profile Service
export const getMyProfileService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// Get User By ID Service
export const getUserByIdService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// Get All Users Service (for chat sidebar/search)
export const getAllUsersService = async ({ currentUserId, search = "" }) => {
  const query = {
    _id: { $ne: currentUserId },
    isBlocked: false,
  };

  if (search?.trim()) {
    const keyword = search.trim();

    query.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password -resetToken -resetTokenExpiry")
    .sort({ isOnline: -1, lastSeen: -1, createdAt: -1 });

  return users;
};

// Update My Profile Service
export const updateMyProfileService = async ({ userId, data }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { name, bio, phone } = data;

  // Update name
  if (typeof name === "string") {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      throw new ApiError(400, "Name must be between 2 and 50 characters");
    }

    user.name = trimmedName;
  }

  // Update bio
  if (typeof bio === "string") {
    const trimmedBio = bio.trim();

    if (trimmedBio.length > 200) {
      throw new ApiError(400, "Bio cannot exceed 200 characters");
    }

    user.bio = trimmedBio;
  }

  // Update phone
  if (typeof phone === "string") {
    const trimmedPhone = phone.trim();

    if (trimmedPhone.length < 8 || trimmedPhone.length > 20) {
      throw new ApiError(400, "Phone number must be between 8 and 20 characters");
    }

    const existingPhoneUser = await User.findOne({
      phone: trimmedPhone,
      _id: { $ne: userId },
    });

    if (existingPhoneUser) {
      throw new ApiError(409, "Phone number already in use");
    }

    user.phone = trimmedPhone;
  }

  await user.save();

  return user;
};

// Update User Avatar Service
export const updateUserAvatarService = async ({ userId, avatarData }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.avatar?.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId, {
      resource_type: "image",
    });
  }

  user.avatar = {
    url: avatarData.url,
    publicId: avatarData.publicId,
  };

  await user.save();

  return user;
};

// Change Password Service
export const changePasswordService = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user.save();

  return true;
};

// Block / Unblock User Service (future admin use)
export const toggleBlockUserService = async ({ userId, isBlocked }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isBlocked = Boolean(isBlocked);
  await user.save();

  return user;
};




