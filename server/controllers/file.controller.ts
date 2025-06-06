import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import {
  createEmptyFolder,
  listObjects,
  deleteObject,
  generateSignedUrl,
  deleteFolder,
  listFolderObjects,
  getFileStream,
  copyObject,
  createMultipartUpload,
  uploadPart,
  completeMultipartUpload
} from '../utils/s3Helpers.js';
import archiver from 'archiver';
import {
  UploadFilesRequest,
  CreateFolderRequest,
  ListFilesRequest,
  DeleteRequest,
  SignedUrlRequest,
  RenameRequest,
  DownloadFolderRequest,
  InitiateUploadRequest,
  UploadChunkRequest,
  CompleteUploadRequest
} from '../types.js';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import s3 from '../utils/s3Client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadFiles = async (req: UploadFilesRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const files = req.files;
  let folderPath = req.body.folder || '';
  if (folderPath.startsWith(`users/${userId}/`)) {
    folderPath = folderPath.slice(`users/${userId}/`.length);
  }

  if (!files?.length) {
    res.status(400).json({ message: 'No files uploaded' });
    return;
  }

  const results: any[] = [];
  let completed = 0;

  files.forEach((file) => {
    const worker = new Worker(path.join(__dirname, '../workers/uploadWorker.js'), {
      workerData: { file, userId, folderPath }
    });

    worker.on('message', (data) => {
      results.push(data);
      completed++;
      if (completed === files.length) {
        res.status(200).json({ message: 'Files uploaded', results });
      }
    });

    worker.on('error', (err) => res.status(500).json({ error: err.message }));
  });
};

export const createFolder = async (req: CreateFolderRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { folderPath, currentFolder } = req.body;
  
  // Decode the folder path to prevent double encoding
  const decodedFolderPath = decodeURIComponent(folderPath);
  const folderPathFinal = currentFolder ? `${currentFolder}/${decodedFolderPath}` : `${decodedFolderPath}`;

  if (!folderPath) {
    res.status(400).json({ message: 'Folder path required' });
    return;
  }
  
  try {
    const key = `users/${userId}/${folderPathFinal.replace(/\/?$/, '/')}`;
    await createEmptyFolder(key);
    res.status(201).json({ message: 'Folder created', key });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const listFiles = async (req: ListFilesRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  let { prefix } = req.query;

  if (prefix && !prefix.endsWith('/')) {
    prefix += '/';
  }
  
  const Prefix = `users/${userId}/${prefix || ''}`;
  console.log('Listing files with prefix:', Prefix);

  try {
    const { folders, files } = await listObjects(Prefix);
    console.log('S3 Response - Folders:', folders);
    console.log('S3 Response - Files:', files);
    res.status(200).json({ folders, files });
  } catch (err) {
    console.error("S3 List Error:", err);
    res.status(500).json({ error: "Failed to list files and folders" });
  }
};

export const deleteFileOrFolder = async (req: DeleteRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { key, isFolder } = req.body;

  console.log('Delete request received:', { userId, key, isFolder });

  if (!key) {
    res.status(400).json({ message: 'Key is required' });
    return;
  }

  const fullKey = key;
  console.log('Full key for deletion:', fullKey);

  try {
    if (isFolder) {
      console.log('Deleting folder:', fullKey);
      await deleteFolder(fullKey);
      console.log('Folder deleted successfully:', fullKey);
      res.status(200).json({ message: 'Folder deleted' });
    } else {
      console.log('Deleting file:', fullKey);
      await deleteObject(fullKey);
      console.log('File deleted successfully:', fullKey);
      res.status(200).json({ message: 'File deleted' });
    }
  } catch (err) {
    console.error('Delete operation failed:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const getSignedUrl = async (req: SignedUrlRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { key } = req.query;

  if (!key) {
    res.status(400).json({ message: 'Key is required' });
    return;
  }

  try {
    const url = await generateSignedUrl(key as string);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const renameFileOrFolder = async (req: RenameRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { key, newName, isFolder } = req.body;

  if (!key || !newName) {
    res.status(400).json({ message: 'Key and new name are required' });
    return;
  }

  try {
    // Clean and normalize the key
    const cleanKey = key.replace(/^\/+/, '');
    
    // Split the path into parts
    const pathParts = cleanKey.split('/');
    const oldName = pathParts.pop() || '';
    const parentPath = pathParts.join('/');
    
    // Construct source and destination keys
    const sourceKey = isFolder ? `${parentPath}/${oldName}/` : `${parentPath}/${oldName}`;
    const destinationKey = isFolder ? `${parentPath}/${newName}/` : `${parentPath}/${newName}`;

    if (isFolder) {
      // For folders, we need to copy all contents and then delete the old folder
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: sourceKey,
      });
      
      const listedObjects = await s3.send(listCommand);
      
      if (listedObjects.Contents) {
        // Copy all objects to their new location
        for (const obj of listedObjects.Contents) {
          if (!obj.Key) continue;
          
          // Calculate the new key by replacing the old folder name with the new one
          const newKey = obj.Key.replace(sourceKey, destinationKey);
          await copyObject(obj.Key, newKey);
        }
        
        // Delete all objects in the old folder
        for (const obj of listedObjects.Contents) {
          if (!obj.Key) continue;
          await deleteObject(obj.Key);
        }
      }

      // Create an empty folder marker in the new location if the folder was empty
      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        await createEmptyFolder(destinationKey);
      }
    } else {
      // For files, just copy and delete
      await copyObject(sourceKey, destinationKey);
      await deleteObject(sourceKey);
    }

    res.json({ message: 'Item renamed successfully' });
  } catch (err) {
    console.error('Rename error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  const { key } = req.query;
  if (!key) {
    res.status(400).json({ message: 'Key is required' });
    return;
  }
  try {
    const stream = await getFileStream(key as string);
    res.setHeader('Content-Disposition', `attachment; filename="${(key as string).split('/').pop()}"`);
    stream.pipe(res);
  } catch (err) {
    console.error('File download error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const downloadFolderAsZip = async (req: DownloadFolderRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  let folder = req.params[0];
  if (!folder.endsWith('/')) folder += '/';
  const fullFolderKey = `users/${userId}/${folder}`;
  try {
    const objects = await listFolderObjects(fullFolderKey);
    if (!objects || objects.length === 0) {
      res.status(404).json({ message: 'No files found in folder' });
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${folder.split('/').filter(Boolean).pop() || 'folder'}.zip"`
    );

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).send({ message: 'Error creating archive' });
    });

    archive.pipe(res);

    for (const obj of objects) {
      if (!obj.Key || obj.Key.endsWith('/')) continue;
      const stream = await getFileStream(obj.Key);
      const fileName = obj.Key.split('/').pop();
      if (fileName) {
        archive.append(stream, { name: fileName });
      }
    }

    archive.finalize();
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

// Initialize multipart upload
export const initiateUpload = async (req: InitiateUploadRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { fileName, contentType, folder } = req.body;

  if (!fileName) {
    res.status(400).json({ message: 'File name is required' });
    return;
  }

  try {
    const key = folder ? `users/${userId}/${folder}/${fileName}` : `users/${userId}/${fileName}`;
    const uploadId = await createMultipartUpload(key, contentType);

    res.json({ uploadId, key });
  } catch (err) {
    console.error('Failed to initiate upload:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to initiate upload' });
  }
};

// Upload a chunk
export const uploadChunk = async (req: UploadChunkRequest, res: Response): Promise<void> => {
  const { uploadId, key, partNumber } = req.body;
  const chunk = req.file?.buffer;

  if (!uploadId || !key || !partNumber || !chunk) {
    res.status(400).json({ message: 'Missing required parameters' });
    return;
  }

  try {
    const part = await uploadPart(key, uploadId, partNumber, chunk);

    res.json({ 
      ETag: part.ETag,
      PartNumber: part.PartNumber
    });
  } catch (err) {
    console.error('Failed to upload chunk:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to upload chunk' });
  }
};

// Complete multipart upload
export const completeUpload = async (req: CompleteUploadRequest, res: Response): Promise<void> => {
  const { uploadId, key, parts } = req.body;

  if (!uploadId || !key || !parts) {
    res.status(400).json({ message: 'Missing required parameters' });
    return;
  }

  try {
    await completeMultipartUpload(key, uploadId, parts);

    res.json({ message: 'Upload completed successfully' });
  } catch (err) {
    console.error('Failed to complete upload:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to complete upload' });
  }
};
