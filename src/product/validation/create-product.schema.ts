import z from "zod";

const imageSchema = z.object({
  url: z.string().url("Image URL must be a valid URL").or(z.string().min(1, "Image URL is required")),
  filename: z.string().optional(),
  alt: z.string().max(200, "Alt text cannot exceed 200 characters").optional(),
  mimeType: z.string().optional(),
  size: z.number().positive().optional(),
});

export const createProductSchema = z.object({
  name: z.string()
    .min(3, "Product name must be at least 3 characters")
    .max(200, "Product name cannot exceed 200 characters")
    .trim(),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters")
    .trim(),
  price: z.number()
    .positive("Price must be a positive number")
    .min(0.01, "Price must be at least 0.01")
    .max(1000000, "Price cannot exceed 1,000,000"),
  discount: z.number()
    .nonnegative("Discount must be non-negative")
    .max(100, "Discount cannot exceed 100%")
    .optional(),
  stock: z.number()
    .int("Stock must be an integer")
    .nonnegative("Stock must be non-negative"),
  brandId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Brand ID must be a valid MongoDB ObjectId"),
  categoryId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Category ID must be a valid MongoDB ObjectId"),
  images: z.array(imageSchema)
    .max(10, "Product cannot have more than 10 images")
    .optional(),
});
