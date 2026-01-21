import {
  IsAlpha,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsStrongPassword,
  Min,
} from 'class-validator';

export class SignUpDto {
  @IsString()
  @IsAlpha()
  name: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 8,
  })
  password: string;

  @IsStrongPassword({
    minLength: 8,
  })
  confirmPassword: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;
}
