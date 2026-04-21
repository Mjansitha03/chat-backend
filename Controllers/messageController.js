import mongoose from "mongoose";
import Chat from "../Models/chatSchema.js";
import Message from "../Models/messageSchema.js";
import {
  sendMessageService,
  getMessagesByChatService,
  markMessagesAsSeenService,
  deleteMessageService,
} from "../Services/messageService.js";

import asyncHandler from "../Utils/asyncHandler.js";
import ApiResponse from "../Utils/ApiResponse.js";


export const sendMessage = asyncHandler(async (req, res) => {
  const {
    chatId,
    content,
    messageType,
    fileUrl,
    fileName,
    fileSize,
    mimeType,
  } = req.body;

  const message = await sendMessageService({
    currentUserId: req.user._id,
    chatId,
    content,
    messageType,
    fileUrl,
    fileName,
    fileSize,
    mimeType,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Message sent successfully", message));
});



export const getMessagesByChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const messages = await getMessagesByChatService({
    currentUserId: req.user._id,
    chatId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Messages fetched successfully", messages));
});



export const markMessagesAsSeen = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  const messages = await markMessagesAsSeenService({
    currentUserId: req.user._id,
    chatId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Messages marked as seen", messages));
});



export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.body;

  const message = await deleteMessageService({
    currentUserId: req.user._id,
    messageId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Message deleted successfully", message));
});

export const deleteMultipleMessages = asyncHandler(async (req, res) => {
  const { messageIds } = req.body;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    throw new Error("No message IDs provided");
  }

  const objectIds = messageIds.map((id) => new mongoose.Types.ObjectId(id));
  const userObjectId = new mongoose.Types.ObjectId(req.user._id);

  const result = await Message.updateMany(
    {
      _id: { $in: objectIds },
      sender: userObjectId, 
    },
    {
      $set: {
        isDeleted: true,
        content: "",
        fileUrl: "",
        fileName: "",
        fileSize: 0,
        mimeType: "",
      },
    }
  );

  console.log("Deleted count:", result.modifiedCount);

  return res.status(200).json(
    new ApiResponse(200, "Messages deleted successfully", {
      deletedIds: messageIds,
      deletedCount: result.modifiedCount,
    })
  );
});



