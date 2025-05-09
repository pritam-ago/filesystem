import mongoose, { Document, Schema } from 'mongoose';

interface IS3Folder {
  bucketName: string;
  userFolderKey: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  s3Folder: IS3Folder;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  s3Folder: {
    bucketName: String,
    userFolderKey: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', userSchema); 