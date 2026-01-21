import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../database/repositories/base.repository';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from './cart.model';

@Injectable()
export class CartRepo extends BaseRepository<Cart> {
  constructor(@InjectModel(Cart.name) private readonly cartModel: Model<Cart>) {
    super(cartModel);
  }

  async findByUserId(userId: string | Types.ObjectId) {
    return this.cartModel.findOne({ userId, isActive: true });
  }

  async findByIdWithPopulate(id: string | Types.ObjectId) {
    return this.cartModel
      .findById(id)
      .populate({
        path: 'items.productId',
        select: 'name price discount stock images slug isActive',
        populate: [
          { path: 'brandId', select: 'name image' },
          { path: 'categoryId', select: 'name image' },
        ],
      })
      .populate('userId', 'name email');
  }

  async findByUserIdWithPopulate(userId: string | Types.ObjectId) {
    return this.cartModel
      .findOne({ userId, isActive: true })
      .populate({
        path: 'items.productId',
        select: 'name price discount stock images slug isActive',
        populate: [
          { path: 'brandId', select: 'name image' },
          { path: 'categoryId', select: 'name image' },
        ],
      })
      .populate('couponId', 'code description discountType discountValue');
  }

  async createOrUpdate(userId: string | Types.ObjectId, update: any) {
    return this.cartModel.findOneAndUpdate({ userId, isActive: true }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  async clearCart(userId: string | Types.ObjectId) {
    return this.cartModel.findOneAndUpdate(
      { userId, isActive: true },
      {
        items: [],
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
        itemCount: 0,
        couponId: undefined,
        couponCode: undefined,
        couponDiscount: 0,
      },
      { new: true },
    );
  }
}
