import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderRepo } from '../order.repo';
import { CartRepo } from 'src/cart/cart.repo';
import { ProductRepo } from 'src/product/product.repo';
import { CouponRepo } from 'src/coupon/coupon.repo';
import { Types } from 'mongoose';
import { OrderStatus, OrderItem, ShippingAddress } from '../order.model';
import { generateOrderNumber } from 'src/common/utils/order-number';
import {
  StripePaymentService,
  CashOnDeliveryService,
} from 'src/payment/services';
import { PaymentMethod } from 'src/payment/payment.model';
import { ConfigService } from '@nestjs/config';

interface CheckoutPayload {
  shippingAddress: ShippingAddress;
  shippingCost?: number;
  notes?: string;
  paymentMethod: PaymentMethod;
  successUrl?: string;
  cancelUrl?: string;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly cartRepo: CartRepo,
    private readonly productRepo: ProductRepo,
    private readonly couponRepo: CouponRepo,
    private readonly stripePaymentService: StripePaymentService,
    private readonly cashOnDeliveryService: CashOnDeliveryService,
    private readonly configService: ConfigService,
  ) {}

  async createCheckout(userId: string, payload: CheckoutPayload) {
    // Get user's cart
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate all products are still available and in stock
    const orderItems: OrderItem[] = [];
    for (const cartItem of cart.items) {
      const product = await this.productRepo.findById({
        id: cartItem.productId.toString(),
      });

      if (!product) {
        throw new NotFoundException(
          `Product ${String(cartItem.productId)} not found`,
        );
      }

      if (!product.isActive) {
        throw new BadRequestException(
          `Product ${product.name} is no longer available`,
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`,
        );
      }

      orderItems.push({
        productId: cartItem.productId,
        productName: product.name,
        quantity: cartItem.quantity,
        price: cartItem.price,
        discount: cartItem.discount,
        total: cartItem.total,
      });
    }

    // Calculate totals
    const subtotal = cart.subtotal;
    const totalDiscount = cart.totalDiscount;
    const couponDiscount = cart.couponDiscount || 0;
    const shippingCost = payload.shippingCost || 0;
    const total = subtotal - totalDiscount - couponDiscount + shippingCost;

    // Create order first (with pending payment status)
    const order = await this.orderRepo.create({
      orderNumber: generateOrderNumber(),
      userId: new Types.ObjectId(userId),
      items: orderItems,
      shippingAddress: payload.shippingAddress,
      subtotal,
      totalDiscount,
      couponId: cart.couponId,
      couponCode: cart.couponCode,
      couponDiscount,
      shippingCost,
      total,
      status: OrderStatus.PENDING,
      notes: payload.notes,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'PENDING',
    });

    // Create payment intent based on payment method
    let paymentIntentResult: any;
    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:3000';

    switch (payload.paymentMethod) {
      case PaymentMethod.STRIPE:
        // Use checkout session for better UX
        paymentIntentResult =
          await this.stripePaymentService.createCheckoutSession(
            order._id.toString(),
            userId,
            total,
            'USD',
            payload.successUrl ||
              `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            payload.cancelUrl || `${frontendUrl}/checkout/cancel`,
            {
              orderNumber: order.orderNumber,
            },
          );

        // Update order with Stripe session ID
        await this.orderRepo.findByIdAndUpdate({
          id: order._id.toString(),
          update: {
            stripeCheckoutSessionId: paymentIntentResult.sessionId,
            paymentIntentId: new Types.ObjectId(
              paymentIntentResult.paymentIntentId,
            ),
          },
        });
        break;

      case PaymentMethod.COD:
        paymentIntentResult =
          await this.cashOnDeliveryService.createPaymentIntent(
            order._id.toString(),
            userId,
            total,
            'USD',
            {
              orderNumber: order.orderNumber,
            },
          );

        // Update order with payment intent ID
        await this.orderRepo.findByIdAndUpdate({
          id: order._id.toString(),
          update: {
            paymentIntentId: new Types.ObjectId(
              paymentIntentResult.paymentIntentId,
            ),
            paymentStatus: 'PENDING', // COD is always pending until delivery
          },
        });
        break;

      default:
        throw new BadRequestException('Invalid payment method');
    }

    // Deduct product stock for COD (confirmed order)
    // For Stripe, stock will be deducted when payment succeeds
    if (payload.paymentMethod === PaymentMethod.COD) {
      for (const item of orderItems) {
        const product = await this.productRepo.findById({
          id: item.productId.toString(),
        });
        if (product) {
          await this.productRepo.findByIdAndUpdate({
            id: product._id.toString(),
            update: { stock: product.stock - item.quantity },
            options: { new: true },
          });
        }
      }

      // Increment coupon usage if coupon was used
      if (cart.couponId) {
        await this.couponRepo.incrementUsage(cart.couponId, userId);
      }

      // Clear cart after order creation
      await this.cartRepo.clearCart(userId);
    }

    // Populate order
    const populatedOrder = await this.orderRepo.findByIdWithPopulate(
      order._id.toString(),
    );

    return {
      statusCode: 201,
      message: 'Checkout created successfully',
      data: {
        order: populatedOrder,
        paymentIntent: paymentIntentResult,
      },
    };
  }
}
