import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserModel } from './user.model';
import { UserRepo } from './user.repo';
import { JwtGlobalModule } from 'src/common/modules/jwt.module';

@Module({
  imports: [UserModel, JwtGlobalModule],
  controllers: [UserController],
  providers: [UserService, UserRepo],
  exports: [UserService, UserRepo],
})
export class UserModule {}
