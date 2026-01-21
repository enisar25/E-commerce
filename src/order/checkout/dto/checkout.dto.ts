import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, MaxLength, ValidateNested, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CheckoutDto {
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Shipping cost cannot be negative' })
  shippingCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;

  @IsEnum(['STRIPE', 'COD'])
  @IsNotEmpty()
  paymentMethod: 'STRIPE' | 'COD';

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

