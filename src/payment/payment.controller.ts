import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, type AuthRequest } from 'src/common/guards/auth.guard';
import { PaymentIntentRepo } from './payment.repo';
import { StripePaymentService } from './services/stripe-payment.service';
import { CashOnDeliveryService } from './services/cod-payment.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/roles.enum';
import { OrderRepo } from 'src/order/order.repo';

@Controller('payment')
@UseGuards(AuthGuard)
export class PaymentController {
  constructor(
    private readonly paymentIntentRepo: PaymentIntentRepo,
    private readonly stripePaymentService: StripePaymentService,
    private readonly cashOnDeliveryService: CashOnDeliveryService,
    private readonly orderRepo: OrderRepo,
  ) {}

  @Get('intent/:id')
  async getPaymentIntent(@Req() req: AuthRequest, @Param('id') id: string) {
    const paymentIntent = await this.paymentIntentRepo.findById({ id });

    if (!paymentIntent) {
      return {
        statusCode: 404,
        message: 'Payment intent not found',
        data: null,
      };
    }

    // Users can only view their own payment intents
    if (paymentIntent.userId.toString() !== req.user._id.toString()) {
      return {
        statusCode: 403,
        message: 'Forbidden',
        data: null,
      };
    }

    return {
      statusCode: 200,
      message: 'Payment intent fetched successfully',
      data: paymentIntent,
    };
  }

  @Get('intent/:id/confirm')
  async confirmPayment(@Req() req: AuthRequest, @Param('id') id: string) {
    const paymentIntent = await this.paymentIntentRepo.findById({ id });

    if (!paymentIntent) {
      return {
        statusCode: 404,
        message: 'Payment intent not found',
        data: null,
      };
    }

    if (paymentIntent.userId.toString() !== req.user._id.toString()) {
      return {
        statusCode: 403,
        message: 'Forbidden',
        data: null,
      };
    }

    if (paymentIntent.paymentMethod !== 'STRIPE') {
      return {
        statusCode: 400,
        message: 'Only STRIPE payments can be confirmed by users',
        data: null,
      };
    }

    const result = await this.stripePaymentService.confirmPayment(id);

    return {
      statusCode: 200,
      message: 'Payment confirmed',
      data: result,
    };
  }

  /**
   * Admin-only: confirm COD payment after cash has been collected.
   */
  @Post('admin/cod/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async confirmCodPaymentAdmin(@Param('id') id: string) {
    const paymentIntent = await this.paymentIntentRepo.findById({ id });

    if (!paymentIntent) {
      return {
        statusCode: 404,
        message: 'Payment intent not found',
        data: null,
      };
    }

    if (paymentIntent.paymentMethod !== 'COD') {
      return {
        statusCode: 400,
        message: 'Payment intent is not COD',
        data: null,
      };
    }

    const result = await this.cashOnDeliveryService.confirmPayment(id);

    // Mark order as paid for COD
    await this.orderRepo.findByIdAndUpdate({
      id: paymentIntent.orderId.toString(),
      update: {
        paymentStatus: 'PAID',
      },
    });

    return {
      statusCode: 200,
      message: 'COD payment confirmed by admin',
      data: result,
    };
  }

  /**
   * Admin-only: refund a Stripe-paid order.
   */
  @Post('admin/order/:orderId/refund')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async refundOrder(@Param('orderId') orderId: string) {
    const result = await this.stripePaymentService.refundPayment(orderId);

    return {
      statusCode: 200,
      message: 'Order refunded successfully',
      data: result,
    };
  }
}
