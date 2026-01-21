import { IsNotEmpty, IsMongoId, IsNumber, Min, Max } from 'class-validator';

export class AddToCartDto {
  @IsMongoId({ message: 'Product ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(100, { message: 'Quantity cannot exceed 100' })
  quantity: number;
}
