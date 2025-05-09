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
    id: string;
  };
}

export interface UploadFilesRequest extends AuthenticatedRequest<{}, any, { folder?: string }> {
  files?: Express.Multer.File[];
}

export interface CreateFolderRequest extends AuthenticatedRequest<{}, any, {
  folderPath: string;
  currentFolder?: string;
}> {}

export interface ListFilesRequest extends AuthenticatedRequest<{}, any, any, {
  prefix?: string;
}> {}

export interface DeleteRequest extends AuthenticatedRequest<{}, any, {
  key: string;
  isFolder: boolean;
}> {}

export interface SignedUrlRequest extends AuthenticatedRequest<{}, any, any, {
  key: string;
}> {}

export interface CopyMoveRequest extends AuthenticatedRequest<{}, any, {
  sourceKey: string;
  destinationKey: string;
}> {}

export interface RenameRequest extends AuthenticatedRequest<{}, any, {
  oldKey: string;
  newKey: string;
}> {}

export interface DownloadFolderRequest extends AuthenticatedRequest<{
  folder: string;
}> {} 
