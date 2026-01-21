import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { DiscountType } from '../coupon.model';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Coupon code must be at least 3 characters' })
  @MaxLength(50, { message: 'Coupon code cannot exceed 50 characters' })
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description: string;

  @IsEnum(DiscountType, {
    message: 'Discount type must be PERCENTAGE or FIXED',
  })
  @IsNotEmpty()
  discountType: DiscountType;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'Discount value cannot be negative' })
  @Max(100, { message: 'Discount value cannot exceed 100 for percentage type' })
  discountValue: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Minimum purchase amount cannot be negative' })
  minimumPurchase?: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Maximum discount cannot be negative' })
  maximumDiscount?: number;

  @IsDateString({}, { message: 'Valid from must be a valid date' })
  @IsNotEmpty()
  validFrom: string;

  @IsDateString({}, { message: 'Valid to must be a valid date' })
  @IsNotEmpty()
  validTo: string;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Usage limit cannot be negative' })
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Per user limit must be at least 1' })
  perUserLimit?: number;
}
