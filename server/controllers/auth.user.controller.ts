import type { Request, Response } from 'express';
import User, { IUser } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const s3 = new S3Client({ region: process.env.AWS_REGION });

interface SignupBody {
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface S3FolderData {
  bucketName: string;
  userFolderKey: string;
}

const createS3Folders = async (userId: Types.ObjectId): Promise<S3FolderData> => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const baseKey = `users/${userId}/`;

  const folders = ['images/', 'documents/', 'videos/'];

  const commands = folders.map(folder => {
    return new PutObjectCommand({
      Bucket: bucketName,
      Key: baseKey + folder,
      Body: '', 
    });
  });

  await Promise.all(commands.map(cmd => s3.send(cmd)));

  return {
    bucketName: bucketName!,
    userFolderKey: baseKey,
  };
};

export const signup = async (req: Request<{}, {}, SignupBody>, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ message: 'Username already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const s3Data = await createS3Folders(user._id as unknown as Types.ObjectId);
    user.s3Folder = s3Data;
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      userId: user._id,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
};

export const login = async (req: Request<{}, {}, LoginBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user data' });
  }
}; 