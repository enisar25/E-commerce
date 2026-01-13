import { BadRequestException, Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { UserRepo } from 'src/user/user.repo';
import { OTPTypeEnum } from 'src/otp/otp.model';
import { emailEmmiter, EmailEventsEnum } from 'src/common/utils/email/email.events';
import { OTPService } from 'src/otp/otp.service';
import { template } from 'src/common/utils/email/createHtml';
import { JwtService } from 'src/common/utils/security/token';
import { compareHash, hashData } from 'src/common/utils/security/hash';
import { DEFAULT_ROLE } from 'src/common/enums/roles.enum';
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly otpService: OTPService,
    private readonly jwtService: JwtService,
  ) {}

    async signup(data: SignUpDto) {
      const {age,email,name,password} = data
      const isExist = await this.userRepo.findByEmail(email)
      if(isExist){
        throw new BadRequestException('Email already exists')
      }
      const user = await this.userRepo.create({
        email,
        name,
        password: await hashData(password),
        age,
        role: DEFAULT_ROLE
      })

      const otp = await this.otpService.createOTP(user._id, OTPTypeEnum.VERIFY_EMAIL)
      const subject = 'verify your email'
      const html = template({ otp, name, subject })
      emailEmmiter.publish(EmailEventsEnum.VERIFY_EMAIL,{
        to:email, subject, html
      })

      return {
        statusCode: 201,
        message: 'Signup successful, verification OTP sent',
        data: user,
      };
    }

  async confirmEmail(email: string, otp: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isOtpValid = await this.otpService.validateOTP(user._id, OTPTypeEnum.VERIFY_EMAIL, otp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    const updated = await this.userRepo.verifyUserEmail(user._id);
    if(!updated){
      throw new BadRequestException('Email verification failed');
    }
    await this.otpService.deleteOTP(user._id, OTPTypeEnum.VERIFY_EMAIL, otp);
    return {
      statusCode: 200,
      message: 'Email verified successfully',
      data: updated,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const otp = await this.otpService.resendOTP(user._id, OTPTypeEnum.VERIFY_EMAIL);
    const subject = 'verify your email';
    const html = template({ otp, name: user.name, subject });
    emailEmmiter.publish(EmailEventsEnum.VERIFY_EMAIL, {
      to: email,
      subject,
      html
    });
    return {
      statusCode: 200,
      message: 'Verification email resent successfully',
      data: null,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !(await compareHash(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate access token
    const accessToken = await this.jwtService.generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      statusCode: 200,
      message: 'Login successful',
      data: {
        user,
        accessToken,
      },
    };
  }

}