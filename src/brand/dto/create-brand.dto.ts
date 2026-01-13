import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, IsUrl, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsString()
  @IsOptional()
  size?: number;
}

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Brand name must be at least 2 characters' })
  @MaxLength(100, { message: 'Brand name cannot exceed 100 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsUrl({}, { message: 'Website must be a valid URL' })
  @IsOptional()
  @MaxLength(200, { message: 'Website URL cannot exceed 200 characters' })
  website?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDto)
  image?: ImageDto;
}
