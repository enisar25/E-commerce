import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Schema({
  timestamps: true,
})
export class Coupon {
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [50, 'Coupon code cannot exceed 50 characters'],
  })
  code: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(DiscountType),
    required: true,
    default: DiscountType.PERCENTAGE,
  })
  discountType: DiscountType;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Discount value cannot be negative'],
  })
  discountValue: number; // Percentage (0-100) or fixed amount

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase amount cannot be negative'],
  })
  minimumPurchase: number; // Minimum cart total to use coupon

  @Prop({
    type: Number,
    default: null,
    min: [0, 'Maximum discount cannot be negative'],
  })
  maximumDiscount: number | null; // Maximum discount amount (for percentage coupons)

  @Prop({
    type: Date,
    required: true,
  })
  validFrom: Date;

  @Prop({
    type: Date,
    required: true,
  })
  validTo: Date;

  @Prop({
    type: Number,
    default: null,
    min: [0, 'Usage limit cannot be negative'],
  })
  usageLimit: number | null; // Total usage limit (null = unlimited)

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative'],
  })
  usageCount: number; // Current usage count

  @Prop({
    type: Number,
    default: 1,
    min: [1, 'Per user limit must be at least 1'],
  })
  perUserLimit: number; // How many times a user can use this coupon

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    default: [],
  })
  usedBy: Types.ObjectId[]; // Users who have used this coupon
}

export const couponSchema = SchemaFactory.createForClass(Coupon);

// Add indexes for better query performance
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validTo: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

export const CouponModel = MongooseModule.forFeature([
  {
    name: Coupon.name,
    schema: couponSchema,
  },
]);

export type HCoupon = HydratedDocument<Coupon>;
