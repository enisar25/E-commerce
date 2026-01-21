import z from 'zod';

const shippingAddressSchema = z.object({
  street: z.string().min(1, 'Street is required').trim(),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  zipCode: z.string().min(1, 'Zip code is required').trim(),
  country: z.string().min(1, 'Country is required').trim(),
  phone: z.string().optional(),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  shippingCost: z
    .number()
    .nonnegative('Shipping cost cannot be negative')
    .optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});
