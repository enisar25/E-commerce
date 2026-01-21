import { diskStorage } from 'multer';
import { createFileFilter } from './file-filter';
import { extname } from 'path';

export const disk = (path = './uploads') =>
  diskStorage({
    destination: path,
    filename: (_, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${unique}${ext}`);
    },
  });

export interface DiskStorageOptions {
  maxSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
}

export const getMulterOptions = (
  path = './uploads',
  {
    maxSize = 5 * 1024 * 1024,
    maxFiles = 10,
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  }: DiskStorageOptions = {},
) => ({
  storage: disk(path),
  fileFilter: createFileFilter({ allowedMimeTypes }),
  limits: {
    fileSize: maxSize,
    files: maxFiles,
  },
});
