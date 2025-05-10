import express, { RequestHandler } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  uploadFiles,
  createFolder,
  listFiles,
  deleteFileOrFolder,
  getSignedUrl,
  copyFile,
  moveFile,
  renameFileOrFolder,
  downloadFolderAsZip
} from '../controllers/file.controller.js';
import {
  UploadFilesRequest,
  CreateFolderRequest,
  ListFilesRequest,
  DeleteRequest,
  SignedUrlRequest,
  CopyMoveRequest,
  RenameRequest,
  DownloadFolderRequest
} from '../types.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authenticateToken, upload.array('files'), uploadFiles as unknown as RequestHandler);
router.post('/folder', authenticateToken, createFolder as unknown as RequestHandler);
router.get('/list', authenticateToken, listFiles as unknown as RequestHandler);
router.delete('/', authenticateToken, deleteFileOrFolder as unknown as RequestHandler);
router.get('/url', authenticateToken, getSignedUrl as unknown as RequestHandler);
router.post('/move', authenticateToken, moveFile as unknown as RequestHandler);
router.post('/copy', authenticateToken, copyFile as unknown as RequestHandler);
router.post('/rename', authenticateToken, renameFileOrFolder as unknown as RequestHandler);
router.get('/download/:folder', authenticateToken, downloadFolderAsZip as unknown as RequestHandler);

export default router; 