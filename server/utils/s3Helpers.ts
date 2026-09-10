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
  _Object,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { getMimeType, supportsThumbnail, thumbnailKeyFor, THUMBNAIL_PREFIX } from './mimeTypes.js';

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
    Bucket: process.env.S3_BUCKET,
    Key,
    Body: '',
  });
  await s3.send(command);
};

export const listObjects = async (Prefix: string): Promise<ListObjectsResult> => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET,
    Prefix,
    Delimiter: '/',
  });

  console.log('S3 ListObjectsV2Command params:', {
    Bucket: process.env.S3_BUCKET,
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
  
  // Get all contents without delimiter to calculate folder sizes and last
  // modified dates. ListObjectsV2 caps a response at 1000 keys, so page through
  // the whole prefix - otherwise folders past the first page are sized as 0.
  const allObjects: _Object[] = [];
  let ContinuationToken: string | undefined;

  do {
    const page: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix,
        ContinuationToken,
      })
    );
    if (page.Contents) allObjects.push(...page.Contents);
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);

  // Calculate folder sizes and track last modified dates.
  //
  // Each object counts towards EVERY folder above it, not just its immediate
  // parent, so a folder's reported size includes everything nested beneath it.
  // Attributing only to the direct parent meant a folder containing just
  // subfolders reported 0 bytes.
  for (const obj of allObjects) {
    if (!obj.Key) continue;

    const size = obj.Size || 0;
    const parts = obj.Key.split('/');
    parts.pop(); // drop the object's own name, leaving its ancestor folders

    let ancestor = '';
    for (const part of parts) {
      ancestor += `${part}/`;

      folderSizes.set(ancestor, (folderSizes.get(ancestor) || 0) + size);

      // Update the folder's last modified date if this object is newer
      const currentLastModified = folderLastModified.get(ancestor);
      if (!currentLastModified || (obj.LastModified && obj.LastModified > currentLastModified)) {
        folderLastModified.set(ancestor, obj.LastModified || new Date());
      }
    }
  }

  const folders = (result.CommonPrefixes || []).map(cp => ({
    key: cp.Prefix!,
    name: cp.Prefix!.split("/").filter(Boolean).pop()!,
    size: folderSizes.get(cp.Prefix!) || 0,
    lastModified: folderLastModified.get(cp.Prefix!) || new Date(),
  }));

  // Which thumbnails already exist. One listing of the mirrored prefix answers
  // that for every file at once; probing each file with its own GetObject cost
  // a round trip per row and logged an error for every miss.
  const existingThumbnails = new Set(
    await listAllKeys(`${THUMBNAIL_PREFIX}${Prefix}`)
  );

  const files = (result.Contents || [])
    .filter(obj => obj.Key !== Prefix)
    .map(async (obj: _Object) => {
      const key = obj.Key!;
      const name = key.split("/").pop()!;
      // ListObjectsV2 never returns ContentType, so this was always '' and no
      // file ever qualified for a thumbnail. Derive it from the extension.
      const mimeType = getMimeType(name);
      let thumbnailUrl: string | undefined;

      if (supportsThumbnail(mimeType)) {
        const thumbnailKey = thumbnailKeyFor(key);

        if (existingThumbnails.has(thumbnailKey)) {
          thumbnailUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: thumbnailKey }),
            { expiresIn: 3600 }
          );
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

// Every key under a prefix, following pagination past the 1000-key page cap.
export const listAllKeys = async (Prefix: string): Promise<string[]> => {
  const keys: string[] = [];
  let ContinuationToken: string | undefined;

  do {
    const page: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET, Prefix, ContinuationToken })
    );
    for (const obj of page.Contents || []) {
      if (obj.Key) keys.push(obj.Key);
    }
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);

  return keys;
};

export const putObject = async (Key: string, Body: Buffer, ContentType?: string): Promise<void> => {
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key, Body, ContentType }));
};

export const deleteObject = async (Key: string): Promise<void> => {
  try {
    console.log('Attempting to delete object:', { Bucket: process.env.S3_BUCKET, Key });
    
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET is not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
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
    console.log('Attempting to delete folder:', { Bucket: process.env.S3_BUCKET, Prefix: folderPrefix });
    
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET is not configured');
    }

    const listParams = {
      Bucket: process.env.S3_BUCKET,
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
      Bucket: process.env.S3_BUCKET,
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
    Bucket: process.env.S3_BUCKET,
    Key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
};

export const copyObject = async (sourceKey: string, destinationKey: string): Promise<void> => {
  const copyCommand = new CopyObjectCommand({
    Bucket: process.env.S3_BUCKET,
    CopySource: `${process.env.S3_BUCKET}/${sourceKey}`,
    Key: destinationKey,
  });

  await s3.send(copyCommand);
};

export const listFolderObjects = async (folderKey: string): Promise<ListObjectsV2CommandOutput['Contents']> => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET,
    Prefix: folderKey,
  });

  const result = await s3.send(command);
  return result.Contents;
};

export const getFileStream = async (Key: string): Promise<Readable> => {
  const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key });
  const response = await s3.send(command);
  return response.Body as Readable;
};

export const createMultipartUpload = async (key: string, contentType: string): Promise<string> => {
  const command = new CreateMultipartUploadCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType
  });

  const response = await s3.send(command);
  return response.UploadId!;
};

export const uploadPart = async (
  key: string,
  uploadId: string,
  partNumber: number,
  chunk: Buffer
): Promise<{ ETag: string; PartNumber: number }> => {
  const command = new UploadPartCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: chunk
  });

  const response = await s3.send(command);
  return {
    ETag: response.ETag!,
    PartNumber: partNumber
  };
};

export const completeMultipartUpload = async (
  key: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>
): Promise<void> => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts }
  });

  await s3.send(command);
}; 