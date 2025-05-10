import { workerData, parentPort } from 'worker_threads';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../utils/s3Client.js';
import fs from 'fs';
import { generateThumbnail } from '../utils/thumbnailGenerator.js';

interface WorkerData {
  file: Express.Multer.File;
  userId: string;
  folderPath?: string;
}

interface WorkerResponse {
  success: boolean;
  filename?: string;
  key?: string;
  thumbnailKey?: string;
  error?: string;
}

const { file, userId, folderPath } = workerData as WorkerData;
let prefix = folderPath ? folderPath : '';
if (prefix.startsWith(`users/${userId}/`)) {
  prefix = prefix.slice((`users/${userId}/`).length);
}
prefix = prefix.replace(/^\/+|\/+$/g, ''); // Remove any leading/trailing slashes
const Key = `users/${userId}${prefix ? '/' + prefix : ''}/${file.originalname}`;

const uploadToS3 = async (): Promise<void> => {
  const fileStream = fs.createReadStream(file.path);

  try {
    // Upload the original file
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
      Body: fileStream,
      ContentType: file.mimetype,
    }));

    // Generate and upload thumbnail if supported
    let thumbnailKey: string | undefined;
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/pdf') {
      try {
        const thumbnailBuffer = await generateThumbnail(Key, file.mimetype);
        thumbnailKey = `thumbnails/${Key}`;
        
        await s3.send(new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        }));
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
      }
    }

    fs.unlinkSync(file.path);
    parentPort?.postMessage({ 
      success: true, 
      filename: file.originalname, 
      key: Key,
      thumbnailKey
    } as WorkerResponse);
  } catch (err) {
    parentPort?.postMessage({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    } as WorkerResponse);
  }
};

uploadToS3(); 