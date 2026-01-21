import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Coupon code must be at least 3 characters' })
  @MaxLength(50, { message: 'Coupon code cannot exceed 50 characters' })
  code: string;
}
