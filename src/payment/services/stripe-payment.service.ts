import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentIntentRepo } from '../payment.repo';
import { PaymentIntent, PaymentMethod, PaymentIntentStatus } from '../payment.model';
import { Types } from 'mongoose';
import { OrderRepo } from 'src/order/order.repo';
import { ProductRepo } from 'src/product/product.repo';
import { CouponRepo } from 'src/coupon/coupon.repo';
import { CartRepo } from 'src/cart/cart.repo';
import { OrderStatus } from 'src/order/order.model';

@Injectable()
export class StripePaymentService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentIntentRepo: PaymentIntentRepo,
    @Inject(forwardRef(() => OrderRepo))
    private readonly orderRepo?: OrderRepo,
    @Inject(forwardRef(() => ProductRepo))
    private readonly productRepo?: ProductRepo,
    @Inject(forwardRef(() => CouponRepo))
    private readonly couponRepo?: CouponRepo,
    @Inject(forwardRef(() => CartRepo))
    private readonly cartRepo?: CartRepo,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async createPaymentIntent(
    orderId: string,
    userId: string,
    amount: number,
    currency: string = 'USD',
    metadata?: Record<string, any>,
  ) {
    try {
      // Create Stripe Payment Intent
      const stripeIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          userId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment intent record in database
      const paymentIntent = await this.paymentIntentRepo.create({
        intentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
        paymentMethod: PaymentMethod.STRIPE,
        amount: Math.round(amount * 100),
        currency,
        status: PaymentIntentStatus.PENDING,
        stripePaymentIntentId: stripeIntent.id,
        stripeClientSecret: stripeIntent.client_secret || undefined,
        stripeMetadata: {
          stripeIntentId: stripeIntent.id,
          amount: stripeIntent.amount,
          currency: stripeIntent.currency,
        },
        metadata,
      });

      return {
        paymentIntentId: paymentIntent._id.toString(),
        clientSecret: stripeIntent.client_secret,
        stripePaymentIntentId: stripeIntent.id,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create Stripe payment intent: ${error.message}`,
      );
    }
  }

  async createCheckoutSession(
    orderId: string,
    userId: string,
    amount: number,
    currency: string = 'USD',
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, any>,
  ) {
    try {
      const frontendUrl = this.configService.get<string>('frontend.url') || 'http://localhost:3000';
      
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Order #${orderId}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${frontendUrl}/checkout/cancel`,
        metadata: {
          orderId,
          userId,
          ...metadata,
        },
      });

      // Create payment intent record in database
      const paymentIntent = await this.paymentIntentRepo.create({
        intentId: `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
        paymentMethod: PaymentMethod.STRIPE,
        amount: Math.round(amount * 100),
        currency,
        status: PaymentIntentStatus.PENDING,
        stripeSessionId: session.id,
        stripeMetadata: {
          sessionId: session.id,
          amount: session.amount_total,
          currency: session.currency,
        },
        metadata,
      });

      return {
        paymentIntentId: paymentIntent._id.toString(),
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create Stripe checkout session: ${error.message}`,
      );
    }
  }

  async confirmPayment(paymentIntentId: string) {
    const paymentIntent = await this.paymentIntentRepo.findById({ id: paymentIntentId });
    
    if (!paymentIntent) {
      throw new BadRequestException('Payment intent not found');
    }

    if (!paymentIntent.stripePaymentIntentId) {
      throw new BadRequestException('Stripe payment intent ID not found');
    }

    try {
      const stripeIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntent.stripePaymentIntentId,
      );

      if (stripeIntent.status === 'succeeded') {
        await this.paymentIntentRepo.updateStatus(paymentIntentId, PaymentIntentStatus.SUCCEEDED, {
          completedAt: new Date(),
          receipt: stripeIntent.receipt_email || undefined,
        });
        return { success: true, status: 'succeeded' };
      } else if (stripeIntent.status === 'requires_payment_method') {
        throw new BadRequestException('Payment method is required');
      } else if (stripeIntent.status === 'canceled') {
        await this.paymentIntentRepo.updateStatus(paymentIntentId, PaymentIntentStatus.CANCELLED);
        return { success: false, status: 'canceled' };
      }

      return { success: false, status: stripeIntent.status };
    } catch (error) {
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Admin-triggered refund for a Stripe-paid order.
   * - Creates a Stripe refund
   * - Marks payment intent as cancelled (refunded)
   * - Marks order paymentStatus/status as REFUNDED
   */
  async refundPayment(orderId: string) {
    if (!this.orderRepo) {
      throw new BadRequestException('Order repository not available');
    }

    const paymentIntent = await this.paymentIntentRepo.findByOrderId(orderId);

    if (!paymentIntent || paymentIntent.paymentMethod !== PaymentMethod.STRIPE) {
      throw new BadRequestException('Stripe payment intent not found for this order');
    }

    if (!paymentIntent.stripePaymentIntentId) {
      throw new BadRequestException('Stripe payment intent ID not found');
    }

    try {
      // Create Stripe refund (full amount)
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntent.stripePaymentIntentId,
      });

      // Mark payment intent as cancelled / refunded
      await this.paymentIntentRepo.updateStatus(
        paymentIntent._id.toString(),
        PaymentIntentStatus.CANCELLED,
        {
          metadata: {
            ...paymentIntent.metadata,
            refundId: refund.id,
          },
        },
      );

      // Update order payment + status
      await this.orderRepo.findByIdAndUpdate({
        id: orderId,
        update: {
          paymentStatus: 'REFUNDED',
          status: OrderStatus.REFUNDED,
        },
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to refund payment: ${error.message}`);
    }
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
    const paymentIntent = await this.paymentIntentRepo.findByStripePaymentIntentId(intent.id);
    
    if (paymentIntent) {
      await this.paymentIntentRepo.updateStatus(
        paymentIntent._id.toString(),
        PaymentIntentStatus.SUCCEEDED,
        {
          completedAt: new Date(),
          receipt: intent.receipt_email || undefined,
        },
      );

      await this.finalizeSuccessfulPayment(paymentIntent.orderId.toString(), intent.id);
    }
  }

  private async handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
    const paymentIntent = await this.paymentIntentRepo.findByStripePaymentIntentId(intent.id);
    
    if (paymentIntent) {
      await this.paymentIntentRepo.updateStatus(
        paymentIntent._id.toString(),
        PaymentIntentStatus.FAILED,
        {
          failureReason: intent.last_payment_error?.message || 'Payment failed',
        },
      );
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const paymentIntent = await this.paymentIntentRepo.findByStripeSessionId(session.id);
    
    if (paymentIntent && session.payment_intent) {
      const intent = await this.stripe.paymentIntents.retrieve(
        session.payment_intent as string,
      );
      
      if (intent.status === 'succeeded') {
        await this.paymentIntentRepo.updateStatus(
          paymentIntent._id.toString(),
          PaymentIntentStatus.SUCCEEDED,
          {
            completedAt: new Date(),
            stripePaymentIntentId: intent.id,
            receipt: session.customer_email || undefined,
          },
        );

        await this.finalizeSuccessfulPayment(paymentIntent.orderId.toString(), intent.id);
      }
    }
  }

  /**
   * Finalize order after successful Stripe payment:
   * - Deduct product stock
   * - Increment coupon usage (if applied)
   * - Clear cart for the user
   * Guarded to avoid double processing on webhook retries.
   */
  private async finalizeSuccessfulPayment(orderId: string, stripeIntentId?: string) {
    if (!this.orderRepo || !this.productRepo || !this.cartRepo) {
      return;
    }

    const order = await this.orderRepo.findById({ id: orderId });
    if (!order) return;

    // If already marked as paid, assume finalization done
    if ((order as any).paymentStatus === 'PAID') {
      return;
    }

    // Deduct stock for each item (idempotent-ish: clamp at 0)
    for (const item of order.items) {
      const product = await this.productRepo.findById({ id: item.productId.toString() });
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        await this.productRepo.findByIdAndUpdate({
          id: product._id.toString(),
          update: { stock: newStock },
          options: { new: true },
        });
      }
    }

    // Increment coupon usage if coupon was used
    if (this.couponRepo && order.couponId) {
      await this.couponRepo.incrementUsage(order.couponId, order.userId.toString());
    }

    // Clear cart for the user
    await this.cartRepo.clearCart(order.userId.toString());

    // Mark order as paid and attach stripe intent id if provided
    await this.orderRepo.findByIdAndUpdate({
      id: orderId,
      update: {
        paymentStatus: 'PAID',
        stripePaymentIntentId: stripeIntentId ?? order.stripePaymentIntentId,
      },
    });
  }
}

