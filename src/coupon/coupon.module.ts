import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponModel } from './coupon.model';
import { CouponRepo } from './coupon.repo';
import { UserModel } from 'src/user/user.model';

@Module({
  imports: [CouponModel, UserModel],
  controllers: [CouponController],
  providers: [CouponService, CouponRepo],
  exports: [CouponService, CouponRepo],
})
export class CouponModule {}
