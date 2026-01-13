import { Controller, Get, Post, Body, UsePipes, UseGuards, Req, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import {
  signupSchema,
  loginSchema,
  confirmEmailSchema,
  resendOtpSchema,
} from './validation';
import { AuthGuard, type AuthRequest } from 'src/common/guards/auth.guard';
import { LoginDto } from './dto/login.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new ZodPipe(signupSchema))
  async signup(@Body() data: SignUpDto) {
    return this.authService.signup(data);
  }

  @Post('resend-otp')
  @UsePipes(new ZodPipe(resendOtpSchema))
  async resendVerificationEmail(@Body() dto: ResendOtpDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Post('confirm-email')
  @UsePipes(new ZodPipe(confirmEmailSchema))
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.authService.confirmEmail(dto.email, dto.otp);
  }

  @Post('login')
  @UsePipes(new ZodPipe(loginSchema))
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }


  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: AuthRequest) {
    return {
      statusCode: 200,
      message: 'Profile fetched successfully',
      data: req.user,
    };
  }
}