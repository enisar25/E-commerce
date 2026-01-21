import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsMongoId,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class ImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  filename?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  alt?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  size?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Product name must be at least 3 characters' })
  @MaxLength(200, { message: 'Product name cannot exceed 200 characters' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.1, { message: 'Price must be at least 0.1' })
  @Max(1000000, { message: 'Price cannot exceed 1,000,000' })
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Discount cannot be negative' })
  @Max(100, { message: 'Discount cannot exceed 100%' })
  discount?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;

  @IsMongoId({ message: 'Brand ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  brandId: Types.ObjectId;

  @IsMongoId({ message: 'Category ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  categoryId: Types.ObjectId;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  @MaxLength(10, { message: 'Product cannot have more than 10 images' })
  images?: ImageDto[];
}
