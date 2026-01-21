import { Image } from 'src/common/schemas/image.schema';

export const createImageFromFile = (
  file: Express.Multer.File,
  baseUrl: string = '/uploads',
): Image => {
  return {
    url: `${baseUrl}/${file.filename}`,
    filename: file.filename,
    alt: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
};

export const createImagesFromFiles = (
  files: Express.Multer.File[],
  baseUrl: string = '/uploads',
): Image[] => {
  return files.map((file) => createImageFromFile(file, baseUrl));
};

export const createImageFromString = (
  urlOrFilename: string,
  baseUrl: string = '/uploads',
): Image => {
  // If it's already a full URL, use it; otherwise construct the URL
  const url =
    urlOrFilename.startsWith('http') || urlOrFilename.startsWith('/')
      ? urlOrFilename
      : `${baseUrl}/${urlOrFilename}`;

  return {
    url,
    filename: urlOrFilename.includes('/')
      ? urlOrFilename.split('/').pop()
      : urlOrFilename,
  };
};
