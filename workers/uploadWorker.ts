import { workerData, parentPort } from 'worker_threads';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../utils/s3Client.js';
import fs from 'fs';

interface WorkerData {
  file: Express.Multer.File;
  userId: string;
  folderPath?: string;
}

interface WorkerResponse {
  success: boolean;
  filename?: string;
  key?: string;
  error?: string;
}

const { file, userId, folderPath } = workerData as WorkerData;
const prefix = folderPath ? `${folderPath}/` : '';
const Key = `users/${userId}/${prefix}${file.originalname}`;

const uploadToS3 = async (): Promise<void> => {
  const fileStream = fs.createReadStream(file.path);

  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
      Body: fileStream,
      ContentType: file.mimetype,
    }));
    fs.unlinkSync(file.path);
    parentPort?.postMessage({ success: true, filename: file.originalname, key: Key } as WorkerResponse);
  } catch (err) {
    parentPort?.postMessage({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    } as WorkerResponse);
  }
};

uploadToS3(); 