import { IsEmail, IsString, Length } from "class-validator";

export class ConfirmEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 10)
  otp: string;
}


