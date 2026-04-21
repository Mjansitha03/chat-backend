import bcrypt from "bcryptjs";
import crypto from "crypto";
import validator from "validator";
import User from "../Models/userSchema.js";
import ApiError from "../Utils/ApiError.js";
import generateToken from "../Utils/generateToken.js";
import { sendEmail } from "../Utils/mailer.js";

const RESET_EXPIRY_MINUTES = 2;
const SALT_ROUNDS = 10;


const normalizePhone = (phone = "") => {
  return phone.replace(/\s+/g, "").trim();
};

const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Signup Service
export const signupService = async ({ name, email, password, phone }) => {
  const trimmedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);

  if (!trimmedName || !normalizedEmail || !password || !normalizedPhone) {
    throw new ApiError(400, "All fields are required");
  }

  if (!validator.isLength(trimmedName, { min: 2, max: 50 })) {
    throw new ApiError(400, "Name must be between 2 and 50 characters");
  }

  if (!validator.isEmail(normalizedEmail)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (!validator.isLength(password, { min: 6, max: 128 })) {
    throw new ApiError(400, "Password must be between 6 and 128 characters");
  }

  if (!validator.isMobilePhone(normalizedPhone, "any", { strictMode: false })) {
    throw new ApiError(400, "Please provide a valid phone number");
  }

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
  });

  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new ApiError(409, "User already exists with this email");
    }

    if (existingUser.phone === normalizedPhone) {
      throw new ApiError(409, "User already exists with this phone");
    }
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
  });

  return {
    user: sanitizeUser(user),
  };
};


// Signin Service
export const signinService = async ({ email, password }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  if (!validator.isEmail(normalizedEmail)) {
    throw new ApiError(400, "Invalid email");
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken({
    _id: user._id,
    role: user.role,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

// Forgot Password Service
export const forgotPasswordService = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required");
  }

  if (!validator.isEmail(normalizedEmail)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+resetToken +resetTokenExpiry",
  );

  if (!user) {
    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.resetToken = hashedToken;
  user.resetTokenExpiry = Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${user._id}/${rawToken}`;

  const textMessage = `
You requested a password reset.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${RESET_EXPIRY_MINUTES} minutes.

If you did not request this, please ignore this email.
  `.trim();

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset.</p>
      <p>
        Click the button below to reset your password:
      </p>
      <p>
        <a 
          href="${resetUrl}" 
          style="
            display: inline-block;
            padding: 10px 18px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          "
        >
          Reset Password
        </a>
      </p>
      <p>Or use this link:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in ${RESET_EXPIRY_MINUTES} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: textMessage,
      html: htmlMessage,
    });
  } catch (error) {
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    throw error;
  }

  return {
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };
};

// Verify Reset Token Service
export const verifyResetTokenService = async ({ id, token }) => {
  if (!id || !token) {
    throw new ApiError(400, "Invalid reset link");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    _id: id,
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  }).select("+resetToken +resetTokenExpiry");

  if (!user) {
    throw new ApiError(410, "Reset link is invalid or expired");
  }

  return {
    valid: true,
    expiresInSeconds: Math.max(
      0,
      Math.ceil((user.resetTokenExpiry - Date.now()) / 1000),
    ),
  };
};

// Reset Password Service
export const resetPasswordService = async ({ id, token, password }) => {
  if (!id || !token) {
    throw new ApiError(400, "Invalid reset request");
  }

  if (!password || !validator.isLength(password, { min: 6, max: 128 })) {
    throw new ApiError(400, "Password must be between 6 and 128 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    _id: id,
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  }).select("+password +resetToken +resetTokenExpiry");

  if (!user) {
    throw new ApiError(410, "Reset link expired or already used");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  return {
    message: "Password reset successfully",
  };
};

// Get Current Logged-in User Service
export const getMeService = async (userId) => {
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};




