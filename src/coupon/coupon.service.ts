import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CouponRepo } from './coupon.repo';
import { Types } from 'mongoose';
import { DiscountType } from './coupon.model';
import { HUser } from 'src/user/user.model';
import { UserRole } from 'src/common/enums/roles.enum';

interface CreateCouponPayload {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  perUserLimit?: number;
  createdBy: Types.ObjectId;
}

interface UpdateCouponPayload {
  code?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  validFrom?: Date;
  validTo?: Date;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
}

@Injectable()
export class CouponService {
  constructor(private readonly couponRepo: CouponRepo) {}

  async create(payload: CreateCouponPayload) {
    // Check if code already exists
    const existing = await this.couponRepo.findByCode(payload.code);
    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    // Validate dates
    if (new Date(payload.validFrom) >= new Date(payload.validTo)) {
      throw new BadRequestException(
        'Valid to date must be after valid from date',
      );
    }

    // Validate discount value based on type
    if (
      payload.discountType === DiscountType.PERCENTAGE &&
      payload.discountValue > 100
    ) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const coupon = await this.couponRepo.create({
      ...payload,
      code: payload.code.toUpperCase(),
      minimumPurchase: payload.minimumPurchase || 0,
      perUserLimit: payload.perUserLimit || 1,
    });

    return {
      statusCode: 201,
      message: 'Coupon created successfully',
      data: coupon,
    };
  }

  async findAll(page?: number, limit?: number) {
    const pageNum = page ? Math.max(1, page) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, limit)) : 10;

    const result = await this.couponRepo.findAllWithPagination(
      {},
      { page: pageNum, limit: limitNum },
    );

    return {
      statusCode: 200,
      message: 'Coupons fetched successfully',
      data: result,
    };
  }

  async findOne(id: string) {
    const coupon = await this.couponRepo.findById({ id });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return {
      statusCode: 200,
      message: 'Coupon fetched successfully',
      data: coupon,
    };
  }

  async findByCode(code: string) {
    const coupon = await this.couponRepo.findByCode(code);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return {
      statusCode: 200,
      message: 'Coupon fetched successfully',
      data: coupon,
    };
  }

  async update(id: string, payload: UpdateCouponPayload, admin: HUser) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update coupons');
    }

    const coupon = await this.couponRepo.findById({ id });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // If code is being updated, check if new code exists
    if (payload.code && payload.code.toUpperCase() !== coupon.code) {
      const existing = await this.couponRepo.findByCode(payload.code);
      if (existing && existing._id.toString() !== id) {
        throw new BadRequestException('Coupon code already exists');
      }
    }

    // Validate dates if provided
    const validFrom = payload.validFrom || coupon.validFrom;
    const validTo = payload.validTo || coupon.validTo;
    if (new Date(validFrom) >= new Date(validTo)) {
      throw new BadRequestException(
        'Valid to date must be after valid from date',
      );
    }

    const updated = await this.couponRepo.findByIdAndUpdate({
      id,
      update: {
        ...payload,
        ...(payload.code && { code: payload.code.toUpperCase() }),
      },
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      statusCode: 200,
      message: 'Coupon updated successfully',
      data: updated,
    };
  }

  async remove(id: string, admin: HUser) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete coupons');
    }

    const deleted = await this.couponRepo.findByIdAndDelete({ id });
    if (!deleted) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      statusCode: 200,
      message: 'Coupon deleted successfully',
      data: deleted,
    };
  }

  async validateCoupon(
    code: string,
    cartTotal: number,
    userId: string,
  ): Promise<{
    valid: boolean;
    coupon: any;
    discount: number;
    error?: string;
  }> {
    const coupon = await this.couponRepo.findValidCouponByCode(code);

    if (!coupon) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        error: 'Coupon not found or expired',
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        error: 'Coupon is not active',
      };
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        error: 'Coupon is not valid at this time',
      };
    }

    // Check minimum purchase
    if (cartTotal < coupon.minimumPurchase) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        error: `Minimum purchase of ${coupon.minimumPurchase} required`,
      };
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        error: 'Coupon usage limit reached',
      };
    }

    // Check per user limit
    const userUsageCount = coupon.usedBy.filter(
      (id) => id.toString() === userId,
    ).length;
    if (userUsageCount >= coupon.perUserLimit) {
      return {
        valid: false,
        coupon: null,
        discount: 0,
        error: 'You have reached the maximum usage limit for this coupon',
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (
        coupon.maximumDiscount !== null &&
        discount > coupon.maximumDiscount
      ) {
        discount = coupon.maximumDiscount;
      }
    } else {
      discount = coupon.discountValue;
      if (discount > cartTotal) {
        discount = cartTotal; // Don't allow negative totals
      }
    }

    return {
      valid: true,
      coupon,
      discount: Math.round(discount * 100) / 100,
    };
  }

  async applyCouponToCart(code: string, cartTotal: number, userId: string) {
    const validation = await this.validateCoupon(code, cartTotal, userId);

    if (!validation.valid) {
      throw new BadRequestException(validation.error || 'Invalid coupon');
    }

    return {
      statusCode: 200,
      message: 'Coupon applied successfully',
      data: {
        coupon: validation.coupon,
        discount: validation.discount,
        finalTotal: Math.round((cartTotal - validation.discount) * 100) / 100,
      },
    };
  }
}
