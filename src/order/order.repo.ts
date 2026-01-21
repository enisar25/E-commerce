import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../database/repositories/base.repository';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderStatus } from './order.model';

@Injectable()
export class OrderRepo extends BaseRepository<Order> {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {
    super(orderModel);
  }

  async findByOrderNumber(orderNumber: string) {
    return this.orderModel.findOne({ orderNumber });
  }

  async findByUserId(userId: string | Types.ObjectId, options: any = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const filter: any = { userId };

    if (options.status) {
      filter.status = options.status;
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('couponId', 'code description discountType discountValue')
        .populate({
          path: 'items.productId',
          select: 'name images slug',
          populate: [
            { path: 'brandId', select: 'name image' },
            { path: 'categoryId', select: 'name image' },
          ],
        }),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAll(options: any = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (options.status) {
      filter.status = options.status;
    }

    if (options.userId) {
      filter.userId = options.userId;
    }

    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) {
        filter.createdAt.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        filter.createdAt.$lte = new Date(options.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('couponId', 'code description discountType discountValue')
        .populate({
          path: 'items.productId',
          select: 'name images slug',
          populate: [
            { path: 'brandId', select: 'name image' },
            { path: 'categoryId', select: 'name image' },
          ],
        }),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByIdWithPopulate(id: string | Types.ObjectId) {
    return this.orderModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('couponId', 'code description discountType discountValue')
      .populate({
        path: 'items.productId',
        select: 'name images slug',
        populate: [
          { path: 'brandId', select: 'name image' },
          { path: 'categoryId', select: 'name image' },
        ],
      });
  }

  async updateStatus(
    id: string | Types.ObjectId,
    status: OrderStatus,
    additionalData?: any,
  ) {
    const update: any = { status };

    if (status === OrderStatus.SHIPPED && !additionalData?.shippedAt) {
      update.shippedAt = new Date();
    }

    if (status === OrderStatus.DELIVERED && !additionalData?.deliveredAt) {
      update.deliveredAt = new Date();
    }

    if (status === OrderStatus.CANCELLED) {
      update.cancelledAt = new Date();
      if (additionalData?.cancellationReason) {
        update.cancellationReason = additionalData.cancellationReason;
      }
    }

    return this.orderModel.findByIdAndUpdate(id, update, { new: true });
  }

  async getOrderStats(userId?: string | Types.ObjectId) {
    const filter: any = {};
    if (userId) {
      filter.userId = userId;
    }

    const stats = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
    ]);

    const totalOrders = await this.orderModel.countDocuments(filter);
    const totalRevenue = await this.orderModel.aggregate([
      { $match: { ...filter, status: { $ne: OrderStatus.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    return {
      stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    };
  }
}
