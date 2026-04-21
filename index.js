import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import connectDB from "./Config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import notFoundMiddleware from "./Middlewares/notFoundMiddleware.js";
import errorMiddleware from "./Middlewares/errorMiddleware.js";

import registerSocketHandlers from "./Sockets/socketHandlers.js";

const app = express();
const server = http.createServer(app);

// DB
connectDB();

// SECURITY
app.use(helmet());

// CORS
const CLIENT_URL = process.env.CLIENT_URL;

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// BODY
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// COOKIES
app.use(cookieParser());

// LOGGER
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// HEALTH
app.get("/", (req, res) => {
  res.json({ message: "API running..." });
});

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

app.set("io", io);
registerSocketHandlers(io);

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// ERROR HANDLING
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// START
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running on ${port}`);
});
