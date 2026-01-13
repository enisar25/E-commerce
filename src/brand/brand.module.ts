import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { UserModel } from 'src/user/user.model';
import { UserRepo } from 'src/user/user.repo';
import { BrandModel } from './brand.model';
import { BrandRepo } from './brand.repo';
import { JwtGlobalModule } from 'src/common/modules/jwt.module';

@Module({
  imports: [UserModel, BrandModel, JwtGlobalModule],
  controllers: [BrandController],
  providers: [BrandService, UserRepo, BrandRepo],
})
export class BrandModule {}
