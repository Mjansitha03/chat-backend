import express from "express";
import {
  sendMessage,
  getMessagesByChat,
  markMessagesAsSeen,
  deleteMessage,
  deleteMultipleMessages,
} from "../Controllers/messageController.js";
import { protect } from "../Middlewares/authMiddleware.js";

const router = express.Router();



router.post("/", protect, sendMessage);


router.get("/chat/:chatId", protect, getMessagesByChat);


router.patch("/seen", protect, markMessagesAsSeen);


router.patch("/delete-one", protect, deleteMessage);

router.patch("/delete-many", protect, deleteMultipleMessages);

export default router;




