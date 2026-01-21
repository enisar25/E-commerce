import z from 'zod';
import { OrderStatus } from '../order.model';

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  cancellationReason: z
    .string()
    .max(500, 'Cancellation reason cannot exceed 500 characters')
    .optional(),
});
