import mongoose, { Document, Schema } from 'mongoose';

interface IFile {
  fileName: string;
  filePath: string;
  convertionType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ISession extends Document {
  sessionId: string;
  files: IFile[];
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  files: [{
    fileName: String,
    filePath: String,
    convertionType: String,
    fileSize: Number,
    uploadedAt: Date,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<ISession>('Session', SessionSchema); 