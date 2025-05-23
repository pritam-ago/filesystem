import express, { RequestHandler } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  uploadFiles,
  createFolder,
  listFiles,
  deleteFileOrFolder,
  getSignedUrl,
  renameFileOrFolder,
  downloadFolderAsZip,
  downloadFile,
  initiateUpload,
  uploadChunk,
  completeUpload
} from '../controllers/file.controller.js';
import {
  UploadFilesRequest,
  CreateFolderRequest,
  ListFilesRequest,
  DeleteRequest,
  SignedUrlRequest,
  RenameRequest,
  DownloadFolderRequest
} from '../types.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const chunkUpload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authenticateToken, upload.array('files'), uploadFiles as unknown as RequestHandler);
router.post('/folder', authenticateToken, createFolder as unknown as RequestHandler);
router.get('/list', authenticateToken, listFiles as unknown as RequestHandler);
router.post('/delete', authenticateToken, deleteFileOrFolder as unknown as RequestHandler);
router.get('/signed-url', authenticateToken, getSignedUrl as unknown as RequestHandler);
router.post('/rename', authenticateToken, renameFileOrFolder as unknown as RequestHandler);
router.get('/download/*', authenticateToken, downloadFolderAsZip as unknown as RequestHandler);
router.get('/download-file', authenticateToken, downloadFile as unknown as RequestHandler);

// Chunked upload routes
router.post('/upload/initiate', authenticateToken, initiateUpload as unknown as RequestHandler);
router.post('/upload/chunk', authenticateToken, chunkUpload.single('chunk'), uploadChunk as unknown as RequestHandler);
router.post('/upload/complete', authenticateToken, completeUpload as unknown as RequestHandler);

export default router; 