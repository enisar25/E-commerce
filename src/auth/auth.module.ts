import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModel } from 'src/user/user.model';
import { UserRepo } from 'src/user/user.repo';
import { OTPModule } from 'src/otp/otp.module';
import { JwtGlobalModule } from 'src/common/modules/jwt.module';

@Module({
  imports: [UserModel, OTPModule, JwtGlobalModule],
  controllers: [AuthController],
  providers: [AuthService, UserRepo],
})
export class AuthModule {}
