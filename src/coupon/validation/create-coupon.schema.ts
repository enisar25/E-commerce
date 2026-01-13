import z from "zod";
import { DiscountType } from "../coupon.model";

export const createCouponSchema = z.object({
  code: z.string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code cannot exceed 50 characters")
    .trim()
    .toUpperCase(),
  description: z.string()
    .min(1, "Description is required")
    .max(200, "Description cannot exceed 200 characters")
    .trim(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number()
    .positive("Discount value must be positive")
    .max(100, "Discount value cannot exceed 100 for percentage type"),
  minimumPurchase: z.number()
    .nonnegative("Minimum purchase amount cannot be negative")
    .optional(),
  maximumDiscount: z.number()
    .nonnegative("Maximum discount cannot be negative")
    .optional()
    .nullable(),
  validFrom: z.string().datetime("Valid from must be a valid date"),
  validTo: z.string().datetime("Valid to must be a valid date"),
  usageLimit: z.number()
    .int("Usage limit must be an integer")
    .nonnegative("Usage limit cannot be negative")
    .optional()
    .nullable(),
  perUserLimit: z.number()
    .int("Per user limit must be an integer")
    .min(1, "Per user limit must be at least 1")
    .optional(),
}).refine(
  (data) => {
    if (data.discountType === DiscountType.PERCENTAGE) {
      return data.discountValue <= 100;
    }
    return true;
  },
  {
    message: "Percentage discount cannot exceed 100%",
    path: ["discountValue"],
  }
).refine(
  (data) => new Date(data.validFrom) < new Date(data.validTo),
  {
    message: "Valid to date must be after valid from date",
    path: ["validTo"],
  }
);

