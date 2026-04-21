import multer from "multer";
import ApiError from "../Utils/ApiError.js";


const storage = multer.memoryStorage();


const allowedMimeTypes = [
  
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",

  
  "video/mp4",
  "video/webm",
  "video/quicktime",

  
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",

  
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];



const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new ApiError(
      400,
      "Invalid file type. Only images, videos, PDF, TXT, DOC, DOCX are allowed",
    ),
    false,
  );
};



const upload = multer({
  storage,
  fileFilter,
  limits: {
   fileSize: 50 * 1024 * 1024 
  },
});

export default upload;
