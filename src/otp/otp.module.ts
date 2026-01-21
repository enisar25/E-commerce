import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OTP, otpSchema } from './otp.model';
import { OTPRepo } from './otp.repo';
import { OTPService } from './otp.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: OTP.name, schema: otpSchema }])],
  providers: [OTPRepo, OTPService],
  exports: [OTPService],
})
export class OTPModule {}
