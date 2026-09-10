import sharp from 'sharp';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getFileStream, generateSignedUrl } from './s3Helpers.js';

const THUMBNAIL_SIZE = 200; // Size in pixels for the thumbnail

const FFMPEG_TIMEOUT_MS = 30_000;

export async function generateThumbnail(key: string, mimeType: string): Promise<Buffer> {
  if (mimeType.startsWith('image/')) {
    return generateImageThumbnail(await getFileStream(key));
  }

  if (mimeType.startsWith('video/')) {
    // ffmpeg reads the object over a presigned URL and seeks straight to the
    // frame it wants, so a 57MB recording costs a couple of range requests
    // rather than a full download. Streaming the whole file through the server
    // first took an order of magnitude longer.
    return generateVideoThumbnail(await generateSignedUrl(key));
  }

  if (mimeType === 'application/pdf') {
    return generatePdfThumbnail(await getFileStream(key));
  }

  throw new Error(`Unsupported file type for thumbnail generation: ${mimeType}`);
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

async function generateVideoThumbnail(sourceUrl: string): Promise<Buffer> {
  const tempOutputPath = join(tmpdir(), `${uuidv4()}-output.jpg`);

  try {
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        // -ss before -i seeks by keyframe before decoding, which is what keeps
        // this cheap over the network. After -i it would decode from the start.
        '-ss', '00:00:01',
        '-i', sourceUrl,
        '-frames:v', '1',
        // -update tells the image2 muxer a single file is intended, rather than
        // warning that the filename has no %03d sequence pattern.
        '-update', '1',
        '-vf', `scale=${THUMBNAIL_SIZE}:${THUMBNAIL_SIZE}:force_original_aspect_ratio=increase,crop=${THUMBNAIL_SIZE}:${THUMBNAIL_SIZE}`,
        '-y',
        tempOutputPath
      ]);

      // A short or unreadable video can leave ffmpeg waiting on input forever;
      // never let that hold a request open.
      const timeout = setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        reject(new Error('FFmpeg timed out generating a video thumbnail'));
      }, FFMPEG_TIMEOUT_MS);

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg process exited with code ${code}`));
      });

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    return await readFile(tempOutputPath);
  } finally {
    await unlink(tempOutputPath).catch(() => {});
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