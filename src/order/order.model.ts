import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  productName: string; // Snapshot of product name

  @Prop({
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  })
  price: number; // Price at the time of order

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  })
  discount: number; // Discount at the time of order

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
  })
  total: number; // Calculated total for this item
}

export const orderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  street: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  city: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  state: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  zipCode: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  country: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  phone?: string;
}

export const shippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  orderNumber: string; // Unique order number (e.g., ORD-20240101-001)

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items: OrderItem[]) {
        return items.length > 0;
      },
      message: 'Order must have at least one item',
    },
  })
  items: OrderItem[];

  @Prop({
    type: shippingAddressSchema,
    required: true,
  })
  shippingAddress: ShippingAddress;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
  })
  subtotal: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Total discount cannot be negative'],
  })
  totalDiscount: number; // Product discounts

  @Prop({
    type: Types.ObjectId,
    ref: 'Coupon',
    required: false,
  })
  couponId?: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  couponCode?: string;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Coupon discount cannot be negative'],
  })
  couponDiscount: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative'],
  })
  shippingCost: number;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
  })
  total: number; // Final total: subtotal - totalDiscount - couponDiscount + shippingCost

  @Prop({
    type: String,
    enum: ['STRIPE', 'COD'],
    default: 'COD',
  })
  paymentMethod?: string;

  @Prop({
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  })
  paymentStatus?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'PaymentIntent',
    required: false,
  })
  paymentIntentId?: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  stripeCheckoutSessionId?: string;

  @Prop({
    type: String,
    required: false,
  })
  stripePaymentIntentId?: string;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @Prop({
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  })
  notes?: string;

  @Prop({
    type: Date,
    required: false,
  })
  shippedAt?: Date;

  @Prop({
    type: Date,
    required: false,
  })
  deliveredAt?: Date;

  @Prop({
    type: Date,
    required: false,
  })
  cancelledAt?: Date;

  @Prop({
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
  })
  cancellationReason?: string;
}

export const orderSchema = SchemaFactory.createForClass(Order);

// Add indexes for better query performance
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const OrderModel = MongooseModule.forFeature([
  {
    name: Order.name,
    schema: orderSchema,
  },
]);

export type HOrder = HydratedDocument<Order>;
export type HOrderItem = HydratedDocument<OrderItem>;

