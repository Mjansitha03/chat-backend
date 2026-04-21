import mongoose from "mongoose";
import Message from "../Models/messageSchema.js";
import Chat from "../Models/chatSchema.js";
import { deleteUploadedFileService } from "./uploadService.js";
import ApiError from "../Utils/ApiError.js";


const ALLOWED_MESSAGE_TYPES = ["text", "image", "video", "audio", "file"];

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

const getChatByIdOrFail = async (chatId) => {
  validateObjectId(chatId, "chat id");

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  return chat;
};

const getMessageByIdOrFail = async (messageId) => {
  validateObjectId(messageId, "message id");

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return message;
};

const isUserInChat = (chat, userId) => {
  return chat.users.some(
    (memberId) => memberId.toString() === userId.toString(),
  );
};

const ensureUserInChat = (chat, userId) => {
  if (!isUserInChat(chat, userId)) {
    throw new ApiError(403, "You are not a member of this chat");
  }
};

const populateMessageQuery = (query) =>
  query
    .populate("sender", "name email avatar isOnline lastSeen")
    .populate({
      path: "chat",
      populate: [
        {
          path: "users",
          select: "name email avatar isOnline lastSeen",
        },
        {
          path: "groupAdmin",
          select: "name email avatar",
        },
      ],
    })
    .populate("seenBy", "name email avatar");

const getLastNonDeletedMessageId = async (chatId) => {
  const lastMessage = await Message.findOne({
    chat: chatId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .select("_id");

  return lastMessage?._id || null;
};

// Send Message
export const sendMessageService = async ({
  currentUserId,
  chatId,
  content = "",
  messageType = "text",
  fileUrl = "",
  fileName = "",
  fileSize = 0,
  mimeType = "",
}) => {
  ensureAuth(currentUserId);

  if (!chatId) {
    throw new ApiError(400, "Chat id is required");
  }

  const normalizedMessageType = messageType?.trim() || "text";

  if (!ALLOWED_MESSAGE_TYPES.includes(normalizedMessageType)) {
    throw new ApiError(400, "Invalid message type");
  }

  const trimmedContent = content?.trim() || "";
  const trimmedFileUrl = fileUrl?.trim() || "";

  if (normalizedMessageType === "text" && !trimmedContent) {
    throw new ApiError(400, "Text message content is required");
  }

  if (normalizedMessageType !== "text" && !trimmedFileUrl) {
    throw new ApiError(400, "File URL is required for file messages");
  }

  const chat = await getChatByIdOrFail(chatId);
  ensureUserInChat(chat, currentUserId);

  const message = await Message.create({
    sender: currentUserId,
    chat: chatId,
    content: trimmedContent,
    messageType: normalizedMessageType,
    fileUrl: trimmedFileUrl,
    fileName: fileName?.trim() || "",
    fileSize: Number(fileSize) || 0,
    mimeType: mimeType?.trim() || "",
    seenBy: [currentUserId], 
  });

  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: message._id,
    updatedAt: new Date(),
  });

  return await populateMessageQuery(Message.findById(message._id));
};

// Get Messages By Chat
export const getMessagesByChatService = async ({ currentUserId, chatId }) => {
  ensureAuth(currentUserId);

  if (!chatId) {
    throw new ApiError(400, "Chat id is required");
  }

  const chat = await getChatByIdOrFail(chatId);
  ensureUserInChat(chat, currentUserId);

  return await populateMessageQuery(
    Message.find({
      chat: chatId,
      isDeleted: false,
    }).sort({ createdAt: 1 }),
  );
};

// Mark Messages As Seen
export const markMessagesAsSeenService = async ({ currentUserId, chatId }) => {
  ensureAuth(currentUserId);

  if (!chatId) {
    throw new ApiError(400, "Chat id is required");
  }

  const chat = await getChatByIdOrFail(chatId);
  ensureUserInChat(chat, currentUserId);

  await Message.updateMany(
    {
      chat: chatId,
      isDeleted: false,
      seenBy: { $ne: currentUserId },
    },
    {
      $addToSet: { seenBy: currentUserId },
    },
  );

  return await populateMessageQuery(
    Message.find({
      chat: chatId,
      isDeleted: false,
    }).sort({ createdAt: 1 }),
  );
};

// Delete Message (Soft Delete)
export const deleteMessageService = async ({ currentUserId, messageId }) => {
  ensureAuth(currentUserId);

  if (!messageId) {
    throw new ApiError(400, "Message id is required");
  }

  const message = await getMessageByIdOrFail(messageId);

  if (message.sender.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  if (message.isDeleted) {
    throw new ApiError(400, "Message is already deleted");
  }

 
  if (message.fileUrl && message.publicId) {
    await deleteUploadedFileService({
      publicId: message.publicId,
      resourceType: message.resourceType,
    });
  }


  message.isDeleted = true;
  message.content = "";
  message.fileUrl = "";
  message.fileName = "";
  message.fileSize = 0;
  message.mimeType = "";

  await message.save();

 
  const chat = await Chat.findById(message.chat).select("latestMessage");

  if (chat && chat.latestMessage?.toString() === message._id.toString()) {
    const latestValidMessageId = await getLastNonDeletedMessageId(message.chat);

    await Chat.findByIdAndUpdate(message.chat, {
      latestMessage: latestValidMessageId,
    });
  }

  return await populateMessageQuery(Message.findById(message._id));
};





