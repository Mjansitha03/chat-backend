import express from "express";
import {
  accessPrivateChat,
  createGroupChat,
  getMyChats,
  getChatById,
  renameGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
} from "../Controllers/chatController.js";
import { protect } from "../Middlewares/authMiddleware.js";

const router = express.Router();


router.get("/", protect, getMyChats);


router.post("/private", protect, accessPrivateChat);


router.post("/group", protect, createGroupChat);


router.patch("/group/rename", protect, renameGroup);
router.patch("/group/add-member", protect, addMemberToGroup);
router.patch("/group/remove-member", protect, removeMemberFromGroup);
router.patch("/group/leave", protect, leaveGroup);



router.get("/:chatId", protect, getChatById);

export default router;



