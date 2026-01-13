import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { UserModel } from 'src/user/user.model';
import { BrandModel } from 'src/brand/brand.model';
import { CategoryModel } from 'src/category/category.model';
import { UserRepo } from 'src/user/user.repo';
import { ProductModel } from './product.model';
import { ProductRepo } from './product.repo';
import { JwtGlobalModule } from 'src/common/modules/jwt.module';

@Module({
  imports: [UserModel, BrandModel, CategoryModel, ProductModel, JwtGlobalModule],
  controllers: [ProductController],
  providers: [ProductService, UserRepo, ProductRepo],
})
export class ProductModule {}
