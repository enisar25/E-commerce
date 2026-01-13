import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderModel } from './order.model';
import { OrderRepo } from './order.repo';
import { CartRepo } from 'src/cart/cart.repo';
import { ProductRepo } from 'src/product/product.repo';
import { CouponRepo } from 'src/coupon/coupon.repo';
import { CartModel } from 'src/cart/cart.model';
import { ProductModel } from 'src/product/product.model';
import { CouponModel } from 'src/coupon/coupon.model';
import { UserModel } from 'src/user/user.model';

@Module({
  imports: [OrderModel, CartModel, ProductModel, CouponModel, UserModel],
  controllers: [OrderController],
  providers: [OrderService, OrderRepo, CartRepo, ProductRepo, CouponRepo],
  exports: [OrderService, OrderRepo],
})
export class OrderModule {}

