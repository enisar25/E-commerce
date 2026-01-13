import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { OTPRepo } from './otp.repo';
import { OTPTypeEnum } from './otp.model';
import { generateOTP } from '../common/utils/email/generateOTP';
import { compareHash, hashData } from '../common/utils/security/hash';

@Injectable()
export class OTPService {
  constructor(private readonly otpRepo: OTPRepo) {}

  async createOTP(userId: Types.ObjectId, type: OTPTypeEnum) {
    const existingOTP = await this.otpRepo.findByUserAndType(userId, type);

    if (existingOTP && existingOTP.expiresAt > new Date()) {
      throw new BadRequestException('OTP already exists and is not expired');
    }

    if (existingOTP && existingOTP.expiresAt <= new Date()) {
      await this.otpRepo.findByIdAndDelete({id: existingOTP._id});
    }

    const otp = generateOTP();

    await this.otpRepo.create({
      userId,
      type,
      otp: await hashData(otp),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return otp;
  }

  async validateOTP(userId: Types.ObjectId, type: OTPTypeEnum, otp: string) {
    const existingOTP = await this.otpRepo.findByUserAndType(userId, type);
    if (!existingOTP) {
      throw new BadRequestException('OTP not found');
    }
    if (existingOTP.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }
    const isMatch = await compareHash(otp, existingOTP.otp);
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP');
    }
    return true;
  }

  async deleteOTP(userId: Types.ObjectId, type: OTPTypeEnum, otp: string) {
    await this.otpRepo.findByIdAndDelete({id: userId});
    return true;
  }

  async resendOTP(userId: Types.ObjectId, type: OTPTypeEnum) {
    const existingOTP = await this.otpRepo.findByUserAndType(userId, type);
    if (existingOTP) {
      await this.otpRepo.findByIdAndDelete({ id: existingOTP._id });
    }
    return this.createOTP(userId, type);
  }
}
