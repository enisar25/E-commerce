import {
  Controller,
  Post,
  Headers,
  type RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { StripePaymentService } from './services/stripe-payment.service';

@Controller('payment/webhook')
export class PaymentWebhookController {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly stripePaymentService: StripePaymentService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
      });
    }
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.stripe) {
      return {
        statusCode: 500,
        message: 'Stripe is not configured',
      };
    }

    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    if (!webhookSecret) {
      console.warn('Stripe webhook secret is not configured');
      return {
        statusCode: 500,
        message: 'Webhook secret not configured',
      };
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody as unknown as string,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        message: `Webhook Error: ${err.message}`,
      };
    }

    try {
      await this.stripePaymentService.handleWebhook(event);
      return {
        statusCode: 200,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        statusCode: 500,
        message: 'Error processing webhook',
      };
    }
  }
}

