import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentIntentModel } from './payment.model';
import { PaymentIntentRepo } from './payment.repo';
import {
  StripePaymentService,
  CashOnDeliveryService,
} from './services';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports: [
    PaymentIntentModel,
    ConfigModule,
    forwardRef(() => OrderModule),
  ],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [
    PaymentIntentRepo,
    StripePaymentService,
    CashOnDeliveryService,
  ],
  exports: [
    PaymentIntentRepo,
    StripePaymentService,
    CashOnDeliveryService,
  ],
})
export class PaymentModule {}

