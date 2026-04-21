import mongoose from "mongoose";
import Chat from "../Models/chatSchema.js";
import User from "../Models/userSchema.js";
import Message from "../Models/messageSchema.js";
import ApiError from "../Utils/ApiError.js";

const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const ensureAuth = (currentUserId) => {
  if (!currentUserId) {
    throw new ApiError(401, "Unauthorized");
  }
};

const findUserById = async (userId) => {
  validateObjectId(userId, "user id");

  const user = await User.findById(userId).select("_id");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const getChatByIdOrFail = async (chatId) => {
  validateObjectId(chatId, "chat id");

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return chat;
};

const populateChat = async (chatQueryOrDoc) => {
  const query =
    typeof chatQueryOrDoc.populate === "function"
      ? chatQueryOrDoc
      : Chat.findById(chatQueryOrDoc._id);

  return query
    .populate("users", "-password -resetToken -resetTokenExpiry")
    .populate("groupAdmin", "-password -resetToken -resetTokenExpiry")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name email avatar",
      },
    });
};

const isUserInChat = (chat, userId) => {
  return chat.users.some((member) => member.toString() === userId.toString());
};

const ensureUserInChat = (chat, userId) => {
  console.log("Logged user:", userId);
  console.log("Chat users:", chat.users);

  const isMember = chat.users.some((u) => {
    const memberId = u._id ? u._id.toString() : u.toString();
    return memberId === userId.toString();
  });

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this chat");
  }
};

const ensureGroupChat = (chat) => {
  if (!chat.isGroupChat) {
    throw new ApiError(400, "This action is only allowed for group chats");
  }
};

const ensureGroupAdmin = (chat, currentUserId) => {
  if (
    !chat.groupAdmin ||
    chat.groupAdmin.toString() !== currentUserId.toString()
  ) {
    throw new ApiError(403, "Only group admin can perform this action");
  }
};

// Create or Access Private Chat
export const accessPrivateChatService = async (currentUserId, targetUserId) => {
  ensureAuth(currentUserId);

  if (!targetUserId) {
    throw new ApiError(400, "Target user id is required");
  }

  validateObjectId(targetUserId, "target user id");

  if (currentUserId.toString() === targetUserId.toString()) {
    throw new ApiError(400, "You cannot create a chat with yourself");
  }

  await findUserById(targetUserId);

  let existingChat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [currentUserId, targetUserId] },
    $expr: { $eq: [{ $size: "$users" }, 2] },
  });

  if (existingChat) {
    return await populateChat(Chat.findById(existingChat._id));
  }

  const createdChat = await Chat.create({
    chatName: "private-chat",
    isGroupChat: false,
    users: [currentUserId, targetUserId],
  });

  return await populateChat(Chat.findById(createdChat._id));
};

// Create Group Chat
export const createGroupChatService = async ({
  currentUserId,
  chatName,
  users,
  groupAvatar = "",
  groupDescription = "",
}) => {
  ensureAuth(currentUserId);

  if (!chatName?.trim()) {
    throw new ApiError(400, "Group chat name is required");
  }

  if (!Array.isArray(users)) {
    throw new ApiError(400, "Users must be an array");
  }

  const uniqueUserIds = [...new Set(users.map((id) => id?.toString()))].filter(
    Boolean,
  );

  if (uniqueUserIds.length < 2) {
    throw new ApiError(400, "At least 2 users are required to create a group");
  }

  for (const userId of uniqueUserIds) {
    validateObjectId(userId, "user id");
  }

  const foundUsers = await User.find({ _id: { $in: uniqueUserIds } }).select(
    "_id",
  );

  if (foundUsers.length !== uniqueUserIds.length) {
    throw new ApiError(404, "One or more selected users not found");
  }

  const allMembers = [...new Set([currentUserId.toString(), ...uniqueUserIds])];

  const createdGroup = await Chat.create({
    chatName: chatName.trim(),
    isGroupChat: true,
    users: allMembers,
    groupAdmin: currentUserId,
    groupAvatar: groupAvatar?.trim() || "",
    groupDescription: groupDescription?.trim() || "",
  });

  return await populateChat(Chat.findById(createdGroup._id));
};

// Get My Chats
export const getMyChatsService = async (currentUserId) => {
  ensureAuth(currentUserId);

  const chats = await Chat.find({
    users: { $elemMatch: { $eq: currentUserId } },
  })
    .sort({ updatedAt: -1 })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name email avatar",
      },
    });

  const chatsWithUnread = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: currentUserId },
        seenBy: { $ne: currentUserId },
        isDeleted: false,
      });

      return {
        ...chat.toObject(),
        latestMessage: chat.latestMessage || null, 
        unreadCount,
      };
    }),
  );

  return chatsWithUnread;
};

// Get Single Chat By ID
export const getChatByIdService = async (currentUserId, chatId) => {
  ensureAuth(currentUserId);

  if (!chatId) {
    throw new ApiError(400, "Chat id is required");
  }

  const chat = await populateChat(Chat.findById(chatId));

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  ensureUserInChat(chat, currentUserId);

  return chat;
};

// Rename Group Chat
export const renameGroupService = async ({
  currentUserId,
  chatId,
  chatName,
}) => {
  ensureAuth(currentUserId);

  if (!chatId || !chatName?.trim()) {
    throw new ApiError(400, "Chat id and new chat name are required");
  }

  const chat = await getChatByIdOrFail(chatId);

  ensureGroupChat(chat);
  ensureGroupAdmin(chat, currentUserId);

  chat.chatName = chatName.trim();
  await chat.save();

  return await populateChat(Chat.findById(chat._id));
};

// Add Member to Group
export const addMemberToGroupService = async ({
  currentUserId,
  chatId,
  userId,
}) => {
  ensureAuth(currentUserId);

  if (!chatId || !userId) {
    throw new ApiError(400, "Chat id and user id are required");
  }

  const chat = await getChatByIdOrFail(chatId);

  ensureGroupChat(chat);
  ensureGroupAdmin(chat, currentUserId);

  await findUserById(userId);

  if (isUserInChat(chat, userId)) {
    throw new ApiError(409, "User is already a member of this group");
  }

  chat.users.push(userId);
  await chat.save();

  return await populateChat(Chat.findById(chat._id));
};

// Remove Member from Group
export const removeMemberFromGroupService = async ({
  currentUserId,
  chatId,
  userId,
}) => {
  ensureAuth(currentUserId);

  if (!chatId || !userId) {
    throw new ApiError(400, "Chat id and user id are required");
  }

  const chat = await getChatByIdOrFail(chatId);

  ensureGroupChat(chat);
  ensureGroupAdmin(chat, currentUserId);

  validateObjectId(userId, "user id");

  if (chat.groupAdmin?.toString() === userId.toString()) {
    throw new ApiError(
      400,
      "Group admin cannot remove themselves. Use leave group.",
    );
  }

  if (!isUserInChat(chat, userId)) {
    throw new ApiError(404, "User is not a member of this group");
  }

  chat.users = chat.users.filter(
    (memberId) => memberId.toString() !== userId.toString(),
  );
  await chat.save();

  return await populateChat(Chat.findById(chat._id));
};

// Leave Group
export const leaveGroupService = async ({ currentUserId, chatId }) => {
  ensureAuth(currentUserId);

  if (!chatId) {
    throw new ApiError(400, "Chat id is required");
  }

  const chat = await getChatByIdOrFail(chatId);

  ensureGroupChat(chat);
  ensureUserInChat(chat, currentUserId);

  chat.users = chat.users.filter(
    (memberId) => memberId.toString() !== currentUserId.toString(),
  );

  
  if (chat.groupAdmin?.toString() === currentUserId.toString()) {
    chat.groupAdmin = chat.users.length > 0 ? chat.users[0] : null;
  }


  if (chat.users.length === 0) {
    await Chat.findByIdAndDelete(chat._id);
    return {
      deleted: true,
      message: "Group deleted because no members remained",
    };
  }

  await chat.save();

  const updatedChat = await populateChat(Chat.findById(chat._id));

  return {
    deleted: false,
    chat: updatedChat,
  };
};




