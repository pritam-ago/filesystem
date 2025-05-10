import s3 from './s3Client.js';
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  CopyObjectCommand,
  S3Client,
  ListObjectsV2CommandOutput,
  GetObjectCommandOutput,
  _Object
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

interface Folder {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
}

interface File {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
  type?: string;
  thumbnailUrl?: string;
}

interface ListObjectsResult {
  folders: Folder[];
  files: File[];
}

const formatSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const createEmptyFolder = async (Key: string): Promise<void> => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
    Body: '',
  });
  await s3.send(command);
};

export const listObjects = async (Prefix: string): Promise<ListObjectsResult> => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix,
    Delimiter: '/',
  });

  console.log('S3 ListObjectsV2Command params:', {
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix,
    Delimiter: '/',
  });

  const result = await s3.send(command);
  console.log('Raw S3 response:', {
    CommonPrefixes: result.CommonPrefixes,
    Contents: result.Contents,
  });

  // First, get all folder contents to calculate sizes and last modified dates
  const folderSizes = new Map<string, number>();
  const folderLastModified = new Map<string, Date>();
  
  // Get all contents without delimiter to calculate folder sizes and last modified dates
  const allContentsCommand = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix,
  });
  
  const allContents = await s3.send(allContentsCommand);
  
  // Calculate folder sizes and track last modified dates
  if (allContents.Contents) {
    for (const obj of allContents.Contents) {
      if (!obj.Key || !obj.Size) continue;
      
      // Get the folder path for this object
      const parts = obj.Key.split('/');
      if (parts.length > 1) {
        // Remove the file name and join the rest to get the folder path
        parts.pop();
        const folderPath = parts.join('/') + '/';
        
        // Add the file size to the folder's total
        const currentSize = folderSizes.get(folderPath) || 0;
        folderSizes.set(folderPath, currentSize + obj.Size);

        // Update the folder's last modified date if this file is newer
        const currentLastModified = folderLastModified.get(folderPath);
        if (!currentLastModified || (obj.LastModified && obj.LastModified > currentLastModified)) {
          folderLastModified.set(folderPath, obj.LastModified || new Date());
        }
      }
    }
  }

  const folders = (result.CommonPrefixes || []).map(cp => ({
    key: cp.Prefix!,
    name: cp.Prefix!.split("/").filter(Boolean).pop()!,
    size: folderSizes.get(cp.Prefix!) || 0,
    lastModified: folderLastModified.get(cp.Prefix!) || new Date(),
  }));

  const files = (result.Contents || [])
    .filter(obj => obj.Key !== Prefix)
    .map(async (obj: _Object) => {
      const key = obj.Key!;
      const name = key.split("/").pop()!;
      const mimeType = (obj as any).ContentType || '';
      let thumbnailUrl: string | undefined;

      // Check if this file type supports thumbnails
      if (mimeType.startsWith('image/') || 
          mimeType.startsWith('video/') || 
          mimeType === 'application/pdf') {
        const thumbnailKey = `thumbnails/${key}`;
        try {
          // Check if thumbnail exists
          const thumbnailCommand = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: thumbnailKey,
          });
          await s3.send(thumbnailCommand);
          
          // Generate signed URL for thumbnail
          thumbnailUrl = await getSignedUrl(s3, thumbnailCommand, { expiresIn: 3600 });
        } catch (error) {
          console.error('Failed to get thumbnail URL:', error);
        }
      }

      return {
        key,
        name,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        type: mimeType,
        thumbnailUrl,
      };
    });

  const resolvedFiles = await Promise.all(files);

  return { folders, files: resolvedFiles };
};

export const deleteObject = async (Key: string): Promise<void> => {
  try {
    console.log('Attempting to delete object:', { Bucket: process.env.AWS_BUCKET_NAME, Key });
    
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
    });

    const response = await s3.send(command);
    console.log('Delete object response:', response);
    console.log('Successfully deleted object:', Key);
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
};

export const deleteFolder = async (folderPrefix: string): Promise<void> => {
  try {
    console.log('Attempting to delete folder:', { Bucket: process.env.AWS_BUCKET_NAME, Prefix: folderPrefix });
    
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not configured');
    }

    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: folderPrefix,
    };

    console.log('Listing objects with params:', listParams);
    const listCommand = new ListObjectsV2Command(listParams);
    const listedObjects = await s3.send(listCommand);
    console.log('List objects response:', listedObjects);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log('No objects found in folder:', folderPrefix);
      return;
    }

    console.log(`Found ${listedObjects.Contents.length} objects to delete in folder:`, folderPrefix);
    console.log('Objects to delete:', listedObjects.Contents.map(obj => obj.Key));

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key! })),
      },
    };

    console.log('Delete objects params:', deleteParams);
    const deleteCommand = new DeleteObjectsCommand(deleteParams);
    const deleteResponse = await s3.send(deleteCommand);
    console.log('Delete objects response:', deleteResponse);
    console.log('Successfully deleted folder contents:', folderPrefix);

    if (listedObjects.IsTruncated) {
      console.log('Folder has more contents, continuing deletion...');
      await deleteFolder(folderPrefix);
    }
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

export const generateSignedUrl = async (Key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
};

export const copyObject = async (sourceKey: string, destinationKey: string): Promise<void> => {
  const copyCommand = new CopyObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    CopySource: `${process.env.AWS_BUCKET_NAME}/${sourceKey}`,
    Key: destinationKey,
  });

  await s3.send(copyCommand);
};

export const listFolderObjects = async (folderKey: string): Promise<ListObjectsV2CommandOutput['Contents']> => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: folderKey,
  });

  const result = await s3.send(command);
  return result.Contents;
};

export const getFileStream = async (Key: string): Promise<Readable> => {
  const command = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key });
  const response = await s3.send(command);
  return response.Body as Readable;
}; 