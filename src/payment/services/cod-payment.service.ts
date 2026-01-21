import { Injectable } from '@nestjs/common';
import { PaymentIntentRepo } from '../payment.repo';
import { PaymentIntent, PaymentMethod, PaymentIntentStatus } from '../payment.model';
import { Types } from 'mongoose';

@Injectable()
export class CashOnDeliveryService {
  constructor(private readonly paymentIntentRepo: PaymentIntentRepo) {}

  async createPaymentIntent(
    orderId: string,
    userId: string,
    amount: number,
    currency: string = 'USD',
    metadata?: Record<string, any>,
  ) {
    // For COD, payment is automatically marked as pending
    // It will be confirmed when the order is delivered
    const paymentIntent = await this.paymentIntentRepo.create({
      intentId: `cod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId),
      paymentMethod: PaymentMethod.COD,
      amount: Math.round(amount * 100), // Store in cents for consistency
      currency,
      status: PaymentIntentStatus.PENDING,
      metadata: {
        ...metadata,
        paymentType: 'cash_on_delivery',
        note: 'Payment will be collected upon delivery',
      },
    });

    return {
      paymentIntentId: paymentIntent._id.toString(),
      status: PaymentIntentStatus.PENDING,
      message: 'Payment will be collected upon delivery',
    };
  }

  async confirmPayment(paymentIntentId: string) {
    const paymentIntent = await this.paymentIntentRepo.findById({ id: paymentIntentId });
    
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // For COD, we mark it as succeeded when payment is collected
    await this.paymentIntentRepo.updateStatus(
      paymentIntentId,
      PaymentIntentStatus.SUCCEEDED,
      {
        completedAt: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          collectedAt: new Date().toISOString(),
        },
      },
    );

    return {
      success: true,
      status: PaymentIntentStatus.SUCCEEDED,
      message: 'Payment collected successfully',
    };
  }
}

