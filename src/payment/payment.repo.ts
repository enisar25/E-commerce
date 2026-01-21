import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../database/repositories/base.repository';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaymentIntent, PaymentIntentStatus } from './payment.model';

@Injectable()
export class PaymentIntentRepo extends BaseRepository<PaymentIntent> {
  constructor(
    @InjectModel(PaymentIntent.name)
    private readonly paymentIntentModel: Model<PaymentIntent>,
  ) {
    super(paymentIntentModel);
  }

  async findByIntentId(intentId: string) {
    return this.paymentIntentModel.findOne({ intentId });
  }

  async findByOrderId(orderId: string | Types.ObjectId) {
    return this.paymentIntentModel
      .findOne({ orderId })
      .populate('orderId')
      .populate('userId', 'name email');
  }

  async findByUserId(userId: string | Types.ObjectId, options: any = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const filter: any = { userId };

    if (options.status) {
      filter.status = options.status;
    }

    const [intents, total] = await Promise.all([
      this.paymentIntentModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('orderId', 'orderNumber total status')
        .populate('userId', 'name email'),
      this.paymentIntentModel.countDocuments(filter),
    ]);

    return { intents, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(
    id: string | Types.ObjectId,
    status: PaymentIntentStatus,
    additionalData?: any,
  ) {
    const update: any = { status };

    if (status === PaymentIntentStatus.SUCCEEDED && !additionalData?.completedAt) {
      update.completedAt = new Date();
    }

    if (additionalData?.failureReason) {
      update.failureReason = additionalData.failureReason;
    }

    if (additionalData?.receipt) {
      update.receipt = additionalData.receipt;
    }

    if (additionalData?.stripePaymentIntentId) {
      update.stripePaymentIntentId = additionalData.stripePaymentIntentId;
    }

    if (additionalData?.stripeClientSecret) {
      update.stripeClientSecret = additionalData.stripeClientSecret;
    }

    if (additionalData?.stripeSessionId) {
      update.stripeSessionId = additionalData.stripeSessionId;
    }

    return this.paymentIntentModel.findByIdAndUpdate(id, update, { new: true });
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string) {
    return this.paymentIntentModel.findOne({ stripePaymentIntentId });
  }

  async findByStripeSessionId(stripeSessionId: string) {
    return this.paymentIntentModel.findOne({ stripeSessionId });
  }
}

