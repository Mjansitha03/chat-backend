import Chat from "../Models/chatSchema.js";
import {
  accessPrivateChatService,
  createGroupChatService,
  getMyChatsService,
  getChatByIdService,
  renameGroupService,
  addMemberToGroupService,
  removeMemberFromGroupService,
  leaveGroupService,
} from "../Services/chatService.js";

import asyncHandler from "../Utils/asyncHandler.js";
import ApiResponse from "../Utils/ApiResponse.js";



export const accessPrivateChat = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;

  const chat = await accessPrivateChatService(req.user._id, targetUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Private chat accessed successfully", chat));
});



export const createGroupChat = asyncHandler(async (req, res) => {
  const { chatName, users, groupAvatar, groupDescription } = req.body;

  const chat = await createGroupChatService({
    currentUserId: req.user._id,
    chatName,
    users,
    groupAvatar,
    groupDescription,
  });

  return res
    .status(201)
    .json(new ApiResponse(201,"Group chat created successfully", chat));
});



export const getMyChats = asyncHandler(async (req, res) => {
  const chats = await getMyChatsService(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Chats fetched successfully", chats));
});



export const getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await getChatByIdService(req.user._id, chatId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Chat fetched successfully", chat));
});



export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const chat = await renameGroupService({
    currentUserId: req.user._id,
    chatId,
    chatName,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Group renamed successfully"));
});



export const addMemberToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await addMemberToGroupService({
    currentUserId: req.user._id,
    chatId,
    userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Member added successfully"));
});



export const removeMemberFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await removeMemberFromGroupService({
    currentUserId: req.user._id,
    chatId,
    userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Member removed successfully"));
});



export const leaveGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  const result = await leaveGroupService({
    currentUserId: req.user._id,
    chatId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Group leave processed successfully"));
});





