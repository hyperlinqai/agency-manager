import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Request } from "express";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Log Cloudinary configuration status (without exposing secrets)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  Cloudinary credentials not fully configured. File uploads may not work.");
} else {
  console.log(`✅ Cloudinary configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for allowed types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Upload file to Cloudinary
export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string = "hq-crm/reports"
): Promise<{
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  original_filename: string;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            bytes: result.bytes,
            original_filename: file.originalname,
          });
        } else {
          reject(new Error("Upload failed - no result returned"));
        }
      }
    );
    
    uploadStream.end(file.buffer);
  });
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// Get file type from mimetype
export function getFileType(mimetype: string): "PDF" | "DOC" | "PPT" | "EXCEL" | "IMAGE" | "OTHER" {
  if (mimetype === "application/pdf") return "PDF";
  if (mimetype.includes("word") || mimetype.includes("document")) return "DOC";
  if (mimetype.includes("powerpoint") || mimetype.includes("presentation")) return "PPT";
  if (mimetype.includes("excel") || mimetype.includes("spreadsheet")) return "EXCEL";
  if (mimetype.startsWith("image/")) return "IMAGE";
  return "OTHER";
}

export { cloudinary };

