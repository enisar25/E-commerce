import z from 'zod';

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code cannot exceed 50 characters')
    .trim()
    .toUpperCase(),
});
