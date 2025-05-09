import express, { RequestHandler } from 'express';
import multer from 'multer';
import { verifyToken } from '../middlewares/auth.middleware.js';
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

router.post('/upload', verifyToken, upload.array('files'), uploadFiles as unknown as RequestHandler);
router.post('/folder', verifyToken, createFolder as unknown as RequestHandler);
router.get('/list', verifyToken, listFiles as unknown as RequestHandler);
router.delete('/', verifyToken, deleteFileOrFolder as unknown as RequestHandler);
router.get('/url', verifyToken, getSignedUrl as unknown as RequestHandler);
router.post('/move', verifyToken, moveFile as unknown as RequestHandler);
router.post('/copy', verifyToken, copyFile as unknown as RequestHandler);
router.post('/rename', verifyToken, renameFileOrFolder as unknown as RequestHandler);
router.get('/download/:folder', verifyToken, downloadFolderAsZip as unknown as RequestHandler);

export default router; 