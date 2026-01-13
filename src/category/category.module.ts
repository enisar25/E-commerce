import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { UserModel } from 'src/user/user.model';
import { UserRepo } from 'src/user/user.repo';
import { CategoryModel } from './category.model';
import { CategoryRepo } from './category.repo';
import { BrandModel } from 'src/brand/brand.model';
import { JwtGlobalModule } from 'src/common/modules/jwt.module';

@Module({
  imports: [UserModel, CategoryModel, BrandModel, JwtGlobalModule],
  controllers: [CategoryController],
  providers: [CategoryService, UserRepo, CategoryRepo],
  exports: [CategoryService, CategoryRepo],
})
export class CategoryModule {}
