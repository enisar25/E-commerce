import z from 'zod';

const imageSchema = z.object({
  url: z
    .string()
    .url('Image URL must be a valid URL')
    .or(z.string().min(1, 'Image URL is required')),
  filename: z.string().optional(),
  alt: z.string().max(200, 'Alt text cannot exceed 200 characters').optional(),
  mimeType: z.string().optional(),
  size: z.number().positive().optional(),
});

export const createBrandSchema = z.object({
  name: z
    .string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(100, 'Brand name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  website: z
    .string()
    .url('Website must be a valid URL')
    .max(200, 'Website URL cannot exceed 200 characters')
    .optional(),
  image: imageSchema.optional(),
});
