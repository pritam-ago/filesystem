import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: {
    userId: string;
  };
}

export interface UploadFilesRequest extends AuthenticatedRequest {
  files?: Express.Multer.File[];
  body: {
    folder?: string;
  };
}

export interface CreateFolderRequest extends AuthenticatedRequest {
  body: {
    folderPath: string;
    currentFolder?: string;
  };
}

export interface ListFilesRequest extends AuthenticatedRequest {
  query: {
    prefix?: string;
  };
}

export interface DeleteRequest extends AuthenticatedRequest {
  body: {
    key: string;
    isFolder: boolean;
  };
}

export interface SignedUrlRequest extends AuthenticatedRequest {
  query: {
    key: string;
  };
}

export interface RenameRequest extends AuthenticatedRequest {
  body: {
    key: string;
    newName: string;
    isFolder: boolean;
  };
}

export interface DownloadFolderRequest extends AuthenticatedRequest {
  params: {
    [key: string]: string;
  };
}

export interface InitiateUploadRequest extends Request {
  user: { userId: string };
  body: {
    fileName: string;
    contentType: string;
    folder?: string;
  };
}

export interface UploadChunkRequest extends Request {
  body: {
    uploadId: string;
    key: string;
    partNumber: number;
  };
  file?: Express.Multer.File;
}

export interface CompleteUploadRequest extends Request {
  body: {
    uploadId: string;
    key: string;
    parts: Array<{
      ETag: string;
      PartNumber: number;
    }>;
  };
} 
