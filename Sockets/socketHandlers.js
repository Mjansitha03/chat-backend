import User from "../Models/userSchema.js";
import Chat from "../Models/chatSchema.js";
import Message from "../Models/messageSchema.js";

// ======================================
// Socket Event Names
// ======================================
export const SOCKET_EVENTS = {
  SETUP: "setup",
  CONNECTED: "connected",

  JOIN_CHAT: "join_chat",
  LEAVE_CHAT: "leave_chat",

  TYPING: "typing",
  STOP_TYPING: "stop_typing",

  NEW_MESSAGE: "new_message",
  MESSAGE_RECEIVED: "message_received",

  MESSAGE_SEEN: "message_seen",

  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
};

// ======================================
// Register Socket Handlers
// ======================================
const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    let currentUserId = null;

    // ======================================
    // SETUP USER
    // ======================================
    socket.on(SOCKET_EVENTS.SETUP, async (userData) => {
      try {
        if (!userData?._id) return;

        currentUserId = userData._id.toString();

        socket.join(currentUserId);

        await User.findByIdAndUpdate(currentUserId, {
          isOnline: true,
          lastSeen: null,
        });

        socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
          userId: currentUserId,
        });

        socket.emit(SOCKET_EVENTS.CONNECTED);

        console.log(`👤 User setup: ${currentUserId}`);
      } catch (err) {
        console.error("❌ Setup error:", err.message);
      }
    });

    // ======================================
    // JOIN CHAT
    // ======================================
    socket.on(SOCKET_EVENTS.JOIN_CHAT, (chatId) => {
      if (!chatId) return;

      socket.join(chatId.toString());

      console.log(`💬 Joined chat: ${chatId}`);
    });

    // ======================================
    // LEAVE CHAT
    // ======================================
    socket.on(SOCKET_EVENTS.LEAVE_CHAT, (chatId) => {
      if (!chatId) return;

      socket.leave(chatId.toString());

      console.log(`🚪 Left chat: ${chatId}`);
    });

    // ======================================
    // 🔥 TYPING (UPDATED)
    // ======================================
    socket.on(SOCKET_EVENTS.TYPING, ({ chatId, userName }) => {
      if (!chatId || !userName) return;

      socket.to(chatId).emit(SOCKET_EVENTS.TYPING, {
        chatId,
        userName,
      });
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, ({ chatId }) => {
      if (!chatId) return;

      socket.to(chatId).emit(SOCKET_EVENTS.STOP_TYPING, {
        chatId,
      });
    });

    // ======================================
    // 📩 NEW MESSAGE
    // ======================================
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, async (messageData) => {
      try {
        if (
          !messageData?._id ||
          !messageData?.chat?._id ||
          !messageData?.sender?._id
        ) {
          return;
        }

        const chatId = messageData.chat._id.toString();
        const senderId = messageData.sender._id.toString();

        // Send to chat room
        socket.to(chatId).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

        // Send to all users (fallback)
        const chat = await Chat.findById(chatId).select("users");

        if (chat?.users?.length) {
          chat.users.forEach((memberId) => {
            const memberRoom = memberId.toString();

            if (memberRoom !== senderId) {
              socket
                .to(memberRoom)
                .emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);
            }
          });
        }

        console.log(`📨 Message sent to chat: ${chatId}`);
      } catch (err) {
        console.error("❌ Message error:", err.message);
      }
    });

    // ======================================
    // 👁️ MESSAGE SEEN
    // ======================================
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, async ({ chatId, userId }) => {
      try {
        if (!chatId || !userId) return;

        await Message.updateMany(
          {
            chat: chatId,
            isDeleted: false,
            seenBy: { $ne: userId },
          },
          {
            $addToSet: { seenBy: userId },
          },
        );

        socket.to(chatId.toString()).emit(SOCKET_EVENTS.MESSAGE_SEEN, {
          chatId,
          userId,
        });

        console.log(`👁️ Seen: ${chatId}`);
      } catch (err) {
        console.error("❌ Seen error:", err.message);
      }
    });

    // ======================================
    // 🔴 DISCONNECT
    // ======================================
    socket.on("disconnect", async () => {
      try {
        if (currentUserId) {
          const lastSeen = new Date();

          await User.findByIdAndUpdate(currentUserId, {
            isOnline: false,
            lastSeen,
          });

          socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
            userId: currentUserId,
            lastSeen,
          });

          console.log(`🔴 User offline: ${currentUserId}`);
        }

        console.log(`🔌 Disconnected: ${socket.id}`);
      } catch (err) {
        console.error("❌ Disconnect error:", err.message);
      }
    });
  });
};

export default registerSocketHandlers;




