import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../database/repositories/base.repository';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon } from './coupon.model';

@Injectable()
export class CouponRepo extends BaseRepository<Coupon> {
  constructor(
    @InjectModel(Coupon.name) private readonly couponModel: Model<Coupon>,
  ) {
    super(couponModel);
  }

  async findByCode(code: string) {
    return this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });
  }

  async findActiveCoupons() {
    const now = new Date();
    return this.couponModel.find({
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now },
    });
  }

  async findValidCouponByCode(code: string) {
    const now = new Date();
    return this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now },
    });
  }

  async incrementUsage(
    couponId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ) {
    return this.couponModel.findByIdAndUpdate(
      couponId,
      {
        $inc: { usageCount: 1 },
        $addToSet: { usedBy: userId },
      },
      { new: true },
    );
  }

  async findAllWithPagination(filter: any = {}, options: any = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.couponModel.countDocuments(filter),
    ]);

    return {
      coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
