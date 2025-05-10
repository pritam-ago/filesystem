import sharp from 'sharp';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getFileStream } from './s3Helpers.js';

const THUMBNAIL_SIZE = 200; // Size in pixels for the thumbnail

export async function generateThumbnail(key: string, mimeType: string): Promise<Buffer> {
  const fileStream = await getFileStream(key);
  
  if (mimeType.startsWith('image/')) {
    return generateImageThumbnail(fileStream);
  } else if (mimeType.startsWith('video/')) {
    return generateVideoThumbnail(fileStream, mimeType);
  } else if (mimeType === 'application/pdf') {
    return generatePdfThumbnail(fileStream);
  }
  
  throw new Error('Unsupported file type for thumbnail generation');
}

async function generateImageThumbnail(fileStream: Readable): Promise<Buffer> {
  const buffer = await streamToBuffer(fileStream);
  return sharp(buffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

async function generateVideoThumbnail(fileStream: Readable, mimeType: string): Promise<Buffer> {
  const tempInputPath = join(tmpdir(), `${uuidv4()}-input`);
  const tempOutputPath = join(tmpdir(), `${uuidv4()}-output.jpg`);
  
  try {
    // Write the video stream to a temporary file
    await writeFile(tempInputPath, await streamToBuffer(fileStream));
    
    // Use ffmpeg to extract a frame from the video
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', tempInputPath,
        '-ss', '00:00:01', // Extract frame at 1 second
        '-vframes', '1',
        '-vf', `scale=${THUMBNAIL_SIZE}:${THUMBNAIL_SIZE}:force_original_aspect_ratio=increase,crop=${THUMBNAIL_SIZE}:${THUMBNAIL_SIZE}`,
        '-y',
        tempOutputPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg process exited with code ${code}`));
      });
      
      ffmpeg.on('error', reject);
    });
    
    // Read the generated thumbnail
    const thumbnailBuffer = await readFile(tempOutputPath);
    return thumbnailBuffer;
  } finally {
    // Clean up temporary files
    await Promise.all([
      unlink(tempInputPath).catch(() => {}),
      unlink(tempOutputPath).catch(() => {})
    ]);
  }
}

async function generatePdfThumbnail(fileStream: Readable): Promise<Buffer> {
  const tempInputPath = join(tmpdir(), `${uuidv4()}-input.pdf`);
  const tempOutputPath = join(tmpdir(), `${uuidv4()}-output.jpg`);
  
  try {
    // Write the PDF stream to a temporary file
    await writeFile(tempInputPath, await streamToBuffer(fileStream));
    
    // Use pdftoppm to convert first page to image
    await new Promise<void>((resolve, reject) => {
      const pdftoppm = spawn('pdftoppm', [
        '-jpeg',
        '-f', '1',
        '-l', '1',
        '-scale-to', THUMBNAIL_SIZE.toString(),
        tempInputPath,
        tempOutputPath.replace('.jpg', '')
      ]);
      
      pdftoppm.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pdftoppm process exited with code ${code}`));
      });
      
      pdftoppm.on('error', reject);
    });
    
    // Read the generated thumbnail
    const thumbnailBuffer = await readFile(tempOutputPath);
    return thumbnailBuffer;
  } finally {
    // Clean up temporary files
    await Promise.all([
      unlink(tempInputPath).catch(() => {}),
      unlink(tempOutputPath).catch(() => {})
    ]);
  }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function readFile(path: string): Promise<Buffer> {
  const { readFile } = await import('fs/promises');
  return readFile(path);
} 