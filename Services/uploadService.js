import cloudinary from "../Config/cloudinary.js";
import streamifier from "streamifier";
import ApiError from "../Utils/ApiError.js";


const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(500, error.message || "Cloudinary upload failed"),
          );
        }

        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Format Uploaded File Response
const formatUploadedFile = (file, result) => {
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    width: result.width || null,
    height: result.height || null,
    duration: result.duration || null,
    bytes: result.bytes || file.size,
    createdAt: result.created_at || new Date(),
  };
};

// Upload Single File Service
export const uploadSingleFileService = async ({ file, folder }) => {
  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }

  const targetFolder = folder?.trim() || "chat-app/uploads";

  const result = await uploadToCloudinary(file.buffer, targetFolder, "auto");

  return formatUploadedFile(file, result);
};

// Upload Multiple Files Service
export const uploadMultipleFilesService = async ({ files, folder }) => {
  if (!files || files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const targetFolder = folder?.trim() || "chat-app/uploads";

  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      const result = await uploadToCloudinary(
        file.buffer,
        targetFolder,
        "auto",
      );
      return formatUploadedFile(file, result);
    }),
  );

  return uploadedFiles;
};

// Upload Avatar Service
export const uploadAvatarService = async (file) => {
  if (!file) {
    throw new ApiError(400, "No avatar image uploaded");
  }

  if (!file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image files are allowed for avatar");
  }

  const result = await uploadToCloudinary(
    file.buffer,
    "chat-app/avatars",
    "image",
  );

  return formatUploadedFile(file, result);
};

// Delete Uploaded File Service
export const deleteUploadedFileService = async ({ publicId, resourceType }) => {
  if (!publicId || !publicId.trim()) {
    throw new ApiError(400, "publicId is required");
  }

  const normalizedPublicId = publicId.trim();
  const normalizedResourceType = resourceType?.trim() || "image";

  const result = await cloudinary.uploader.destroy(normalizedPublicId, {
    resource_type: normalizedResourceType,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new ApiError(500, "Failed to delete file from Cloudinary");
  }

  return {
    publicId: normalizedPublicId,
    resourceType: normalizedResourceType,
    result: result.result,
  };
};




