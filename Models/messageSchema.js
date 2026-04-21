import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
      index: true,
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat is required"],
      index: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message content cannot exceed 5000 characters"],
      default: "",
    },

    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file"],
      default: "text",
    },

    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },

    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
      min: [0, "File size cannot be negative"],
    },

    mimeType: {
      type: String,
      trim: true,
      default: "",
    },

    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
    publicId: { type: String },
    resourceType: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);



messageSchema.pre("validate", function () {
   if (this.isDeleted) return;

  const hasText = !!this.content?.trim();
  const hasFile = !!this.fileUrl?.trim();

  if (!hasText && !hasFile) {
    throw new Error("Message must contain text or a file");
  }

  if (this.messageType === "text" && !hasText) {
    throw new Error("Text message must contain content");
  }

  if (this.messageType !== "text" && !hasFile) {
    throw new Error("File message must contain a fileUrl");
  }
});


messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;


