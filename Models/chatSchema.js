import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
      maxlength: [100, "Chat name cannot exceed 100 characters"],
      default: "private-chat",
    },

    isGroupChat: {
      type: Boolean,
      default: false,
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    groupAvatar: {
      type: String,
      trim: true,
      default: "",
    },

    groupDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Group description cannot exceed 300 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


chatSchema.index({ users: 1 });
chatSchema.index({ isGroupChat: 1 });
chatSchema.index({ updatedAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;



  