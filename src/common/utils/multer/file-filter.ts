import { BadRequestException } from '@nestjs/common';

export interface FileFilterOptions {
  allowedMimeTypes?: string[];
  // maxSize?: number; // in bytes
}

export const createFileFilter = (options: FileFilterOptions = {}) => {
  const {
    allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    // maxSize = 5 * 1024 * 1024, // 5MB default
  } = options;

  return (req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        ),
        false,
      );
    }

    // Note: File size is typically checked by multer's limits option
    // This is just for additional validation if needed
    cb(null, true);
  };
};

