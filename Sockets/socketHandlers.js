import User from "../Models/userSchema.js";
import Chat from "../Models/chatSchema.js";
import Message from "../Models/messageSchema.js";

// ================= SOCKET EVENTS =================
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

  GET_ONLINE_USERS: "get_online_users", 
};

// userId => Set(socketIds)
const onlineUsers = new Map();

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    let currentUserId = null;

    // ================= SETUP =================
    socket.on(SOCKET_EVENTS.SETUP, async (userData) => {
      try {
        if (!userData?._id) return;

        currentUserId = userData._id.toString();
        socket.join(currentUserId);

        // MULTI-TAB SUPPORT
        if (!onlineUsers.has(currentUserId)) {
          onlineUsers.set(currentUserId, new Set());
        }

        const userSockets = onlineUsers.get(currentUserId);
        userSockets.add(socket.id);

        // ONLY FIRST CONNECTION → mark online
        if (userSockets.size === 1) {
          await User.updateOne(
            { _id: currentUserId, isOnline: false },
            { isOnline: true, lastSeen: null },
          );

          socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
            userId: currentUserId,
          });

          console.log(`User online: ${currentUserId}`);
        }

        io.emit(SOCKET_EVENTS.GET_ONLINE_USERS, Array.from(onlineUsers.keys()));

        socket.emit(SOCKET_EVENTS.CONNECTED);
      } catch (err) {
        console.error("Setup error:", err.message);
      }
    });

    // ================= JOIN CHAT =================
    socket.on(SOCKET_EVENTS.JOIN_CHAT, (chatId) => {
      if (!chatId) return;
      socket.join(chatId.toString());
    });

    // ================= LEAVE CHAT =================
    socket.on(SOCKET_EVENTS.LEAVE_CHAT, (chatId) => {
      if (!chatId) return;
      socket.leave(chatId.toString());
    });

    // ================= TYPING =================
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

    // ================= NEW MESSAGE =================
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

        // SINGLE SOURCE OF TRUTH
        socket.to(chatId).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messageData);

        console.log(`Message sent to chat: ${chatId}`);
      } catch (err) {
        console.error("Message error:", err.message);
      }
    });

    // ================= MESSAGE SEEN =================
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

        socket
          .to(chatId.toString())
          .emit(SOCKET_EVENTS.MESSAGE_SEEN, { chatId, userId });
      } catch (err) {
        console.error("Seen error:", err.message);
      }
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", async () => {
      try {
        if (!currentUserId) return;

        const userSockets = onlineUsers.get(currentUserId);

        // SAFETY CHECK
        if (!userSockets) return;

        // REMOVE THIS SOCKET
        userSockets.delete(socket.id);

        // ONLY IF NO ACTIVE SESSIONS → OFFLINE
        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);

          const lastSeen = new Date();

          await User.updateOne(
            { _id: currentUserId, isOnline: true },
            { isOnline: false, lastSeen },
          );

          socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
            userId: currentUserId,
            lastSeen,
          });

          console.log(`User offline: ${currentUserId}`);
        }

        // ALWAYS UPDATE ONLINE LIST
        io.emit(SOCKET_EVENTS.GET_ONLINE_USERS, Array.from(onlineUsers.keys()));

        console.log(`Disconnected: ${socket.id}`);
      } catch (err) {
        console.error("Disconnect error:", err.message);
      }
    });
  });
};

export default registerSocketHandlers;


