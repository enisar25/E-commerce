import z from "zod";

export const addToCartSchema = z.object({
  productId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Product ID must be a valid MongoDB ObjectId"),
  quantity: z.number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(100, "Quantity cannot exceed 100"),
});

