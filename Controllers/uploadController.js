import asyncHandler from "../Utils/asyncHandler.js";
import ApiResponse from "../Utils/ApiResponse.js";
import {
  uploadSingleFileService,
  uploadMultipleFilesService,
  uploadAvatarService,
  deleteUploadedFileService,
} from "../Services/uploadService.js";

// Upload Single File
export const uploadSingleFile = asyncHandler(async (req, res) => {

  console.log("FILE:", req.file);
  
  const uploadedFile = await uploadSingleFileService({
    file: req.file,
    folder: req.body.folder,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "File uploaded successfully", uploadedFile));
});

// Upload Multiple Files
export const uploadMultipleFiles = asyncHandler(async (req, res) => {
  const uploadedFiles = await uploadMultipleFilesService({
    files: req.files,
    folder: req.body.folder,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Files uploaded successfully", uploadedFiles));
});

// Upload Avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  const uploadedAvatar = await uploadAvatarService(req.file);

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar uploaded successfully", uploadedAvatar));
});

// Delete Uploaded File
export const deleteUploadedFile = asyncHandler(async (req, res) => {
  const deletedFile = await deleteUploadedFileService({
    publicId: req.body.publicId,
    resourceType: req.body.resourceType,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "File deleted successfully", deletedFile));
});



  