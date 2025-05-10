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
  copyObject,
  moveObject,
  listFolderObjects,
  getFileStream
} from '../utils/s3Helpers.js';
import archiver from 'archiver';
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
  
  const folderPathFinal = currentFolder ? `${currentFolder}/${folderPath}` : `${folderPath}`;

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

  if (!key) {
    res.status(400).json({ message: 'Key is required' });
    return;
  }

  const fullKey = `users/${userId}/${key.replace(/^\/+/, '')}`;
  try {
    if (isFolder) {
      await deleteFolder(fullKey);
      res.status(200).json({ message: 'Folder deleted' });
    } else {
      await deleteObject(fullKey);
      res.status(200).json({ message: 'File deleted' });
    }
  } catch (err) {
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
    const url = await generateSignedUrl(`users/${userId}/${key}`);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const copyFile = async (req: CopyMoveRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { keys, targetFolder } = req.body;

  if (!keys?.length || !targetFolder) {
    res.status(400).json({ message: 'Keys and target folder are required' });
    return;
  }

  try {
    const copiedFiles = [];
    for (const key of keys) {
      const sourceKey = `users/${userId}/${key}`;
      const destinationKey = `users/${userId}/${targetFolder}/${key.split('/').pop()}`;
      await copyObject(sourceKey, destinationKey);
      copiedFiles.push({
        key: destinationKey,
        name: key.split('/').pop(),
      });
    }
    res.json({ message: 'Files copied', copiedFiles });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const moveFile = async (req: CopyMoveRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { keys, targetFolder } = req.body;

  if (!keys?.length || !targetFolder) {
    res.status(400).json({ message: 'Keys and target folder are required' });
    return;
  }

  try {
    for (const key of keys) {
      const sourceKey = `users/${userId}/${key}`;
      const destinationKey = `users/${userId}/${targetFolder}/${key.split('/').pop()}`;
      await moveObject(sourceKey, destinationKey);
    }
    res.json({ message: 'Files moved' });
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
    const sourceKey = `users/${userId}/${key}`;
    const destinationKey = `users/${userId}/${key.split('/').slice(0, -1).join('/')}/${newName}${isFolder ? '/' : ''}`;
    await moveObject(sourceKey, destinationKey);
    res.json({ message: 'Item renamed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred' });
  }
};

export const downloadFolderAsZip = async (req: DownloadFolderRequest, res: Response): Promise<void> => {
  const userId = req.user.userId;
  const { folder } = req.params;

  try {
    const objects = await listFolderObjects(`users/${userId}/${folder}`);
    if (!objects || objects.length === 0) {
      res.status(404).json({ message: 'No files found in folder' });
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${folder}.zip"`
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
