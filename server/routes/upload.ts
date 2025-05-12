import express, { Request, Response, RequestHandler } from "express";
import multer from "multer";
import { Worker } from "worker_threads";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import Session from "../models/Session.js";

dotenv.config();
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UploadedFile {
  fileName: string;
  filePath: string;
  convertionType: string;
  fileSize: number;
  uploadedAt: Date;
}

interface WorkerResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
  file?: Express.Multer.File;
}

interface UploadRequest extends Request {
  files: Express.Multer.File[];
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadHandler: RequestHandler = async (req, res) => {
  const uploadReq = req as UploadRequest;
  if (!uploadReq.files || uploadReq.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded!" });
  }

  const sessionId = req.body.sessionId || uuidv4();
  console.log(`Upload session started: ${sessionId} (${uploadReq.files.length} files)`);

  const uploadPromises = uploadReq.files.map((file: Express.Multer.File) => {
    return new Promise<WorkerResult>((resolve) => {
      const worker = new Worker(path.join(__dirname, "../workers/upload-worker.js"), {
        workerData: { file, sessionId },
      });

      worker.on("message", resolve);
      worker.on("error", (error) =>
        resolve({ success: false, error: error.message, file })
      );
    });
  });

  const results = await Promise.all(uploadPromises);

  const uploadedFiles: UploadedFile[] = results
    .map((result: WorkerResult, index: number) => {
      if (result.success) {
        return {
          fileName: uploadReq.files[index].originalname,
          filePath: result.fileUrl!,
          convertionType: req.body.convertionType || "mp4-mp3",
          fileSize: uploadReq.files[index].size,
          uploadedAt: new Date(),
        };
      }
      return null;
    })
    .filter((file): file is UploadedFile => file !== null);

  if (uploadedFiles.length > 0) {
    await Session.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        $push: { files: { $each: uploadedFiles } },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );
  }

  res.json({
    message: "Upload process completed!",
    sessionId,
    uploads: results,
  });
};

router.post("/", upload.array("files", 10), uploadHandler);

export default router; 