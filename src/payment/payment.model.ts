import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  COD = 'COD', // Cash on Delivery
}

export enum PaymentIntentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Schema({ timestamps: true })
export class PaymentIntent {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  intentId: string; // Stripe payment intent ID or internal ID

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  })
  orderId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  })
  amount: number; // In cents for Stripe, in base currency for others

  @Prop({
    type: String,
    default: 'USD',
  })
  currency: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentIntentStatus),
    default: PaymentIntentStatus.PENDING,
    index: true,
  })
  status: PaymentIntentStatus;

  @Prop({
    type: String,
    required: false,
  })
  stripeSessionId?: string;

  @Prop({
    type: String,
    required: false,
  })
  stripeClientSecret?: string;

  @Prop({
    type: String,
    required: false,
  })
  stripePaymentIntentId?: string;

  @Prop({
    type: Object,
    required: false,
  })
  stripeMetadata?: Record<string, any>;

  @Prop({
    type: Date,
    required: false,
  })
  completedAt?: Date;

  @Prop({
    type: String,
    required: false,
  })
  failureReason?: string;

  @Prop({
    type: String,
    required: false,
  })
  receipt?: string;

  @Prop({
    type: Object,
    required: false,
  })
  metadata?: Record<string, any>;
}

export const paymentIntentSchema = SchemaFactory.createForClass(PaymentIntent);
paymentIntentSchema.index({ userId: 1, status: 1 });
paymentIntentSchema.index({ orderId: 1 });
paymentIntentSchema.index({ createdAt: -1 });

export const PaymentIntentModel = MongooseModule.forFeature([
  {
    name: PaymentIntent.name,
    schema: paymentIntentSchema,
  },
]);

export type HPaymentIntent = HydratedDocument<PaymentIntent>;

