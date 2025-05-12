import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
dotenv.config();

// Log environment variables (without sensitive values)
console.log('AWS Configuration:', {
  region: process.env.AWS_REGION,
  bucketName: process.env.AWS_BUCKET_NAME,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
});

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('Missing required AWS environment variables');
}

if (!process.env.AWS_BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME is not configured');
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Test the S3 client configuration
const testS3Connection = async () => {
  try {
    console.log('Testing S3 connection...');
    // Try to list objects in the bucket
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
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