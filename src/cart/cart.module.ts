import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartModel } from './cart.model';
import { CartRepo } from './cart.repo';
import { ProductModel } from 'src/product/product.model';
import { ProductRepo } from 'src/product/product.repo';
import { UserModel } from 'src/user/user.model';
import { CouponModule } from 'src/coupon/coupon.module';
import { UserRepo } from 'src/user/user.repo';
import { JwtGlobalModule } from 'src/common/modules/jwt.module';

@Module({
  imports: [CartModel, ProductModel, UserModel, CouponModule, JwtGlobalModule],
  controllers: [CartController],
  providers: [CartService, CartRepo, ProductRepo, UserRepo],
  exports: [CartService, CartRepo],
})
export class CartModule {}

