import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
dotenv.config();

// Log storage configuration (without sensitive values)
console.log('S3 configuration:', {
  endpoint: process.env.S3_ENDPOINT || '(AWS default)',
  region: process.env.S3_REGION,
  bucket: process.env.S3_BUCKET,
  hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
});

if (!process.env.S3_REGION || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
  throw new Error('Missing required S3 environment variables');
}

if (!process.env.S3_BUCKET) {
  throw new Error('S3_BUCKET is not configured');
}

const s3 = new S3Client({
  // Any S3-compatible endpoint (MinIO, R2, Spaces...). Must be undefined,
  // not an empty string, so the SDK resolves the real AWS endpoint when unset.
  endpoint: process.env.S3_ENDPOINT || undefined,
  // Addresses buckets as <endpoint>/<bucket> rather than <bucket>.<endpoint>,
  // which is what non-AWS providers expect and AWS still accepts.
  forcePathStyle: true,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

// Test the S3 client configuration
const testS3Connection = async () => {
  try {
    console.log('Testing S3 connection...');
    // Try to list objects in the bucket
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      MaxKeys: 1,
    });
    await s3.send(command);
    console.log('S3 connection successful');
  } catch (error) {
    console.error('S3 connection test failed:', error);
    throw error;
  }
};

testS3Connection().catch(console.error);

export default s3;
