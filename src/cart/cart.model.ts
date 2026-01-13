import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: false })
export class CartItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  })
  price: number; // Price at the time of adding to cart

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
  })
  discount: number; // Discount at the time of adding to cart

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative'],
  })
  total: number; // Calculated: (price * (1 - discount/100)) * quantity
}

export const cartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({
  timestamps: true,
})
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: [cartItemSchema],
    default: [],
    validate: {
      validator: function(items: CartItem[]) {
        return items.length <= 100; // Max 100 items in cart
      },
      message: 'Cart cannot have more than 100 items',
    },
  })
  items: CartItem[];

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Subtotal cannot be negative'],
  })
  subtotal: number; // Sum of all item totals

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Total discount cannot be negative'],
  })
  totalDiscount: number; // Total discount amount

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative'],
  })
  total: number; // Final total: subtotal - totalDiscount

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Item count cannot be negative'],
  })
  itemCount: number; // Total number of items (sum of quantities)

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
    type: Boolean,
    default: true,
  })
  isActive: boolean; // Cart is active or abandoned
}

export const cartSchema = SchemaFactory.createForClass(Cart);

// Add index for faster queries
cartSchema.index({ userId: 1, isActive: 1 });

export const CartModel = MongooseModule.forFeature([
  {
    name: Cart.name,
    schema: cartSchema,
  },
]);

export type HCart = HydratedDocument<Cart>;
export type HCartItem = HydratedDocument<CartItem>;

