import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '../order.model';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message:
      'Status must be one of: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED',
  })
  @IsNotEmpty()
  status: OrderStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500, {
    message: 'Cancellation reason cannot exceed 500 characters',
  })
  cancellationReason?: string;
}
