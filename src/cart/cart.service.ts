import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CartRepo } from './cart.repo';
import { ProductRepo } from 'src/product/product.repo';
import { CouponService } from 'src/coupon/coupon.service';
import { Types } from 'mongoose';
import { CartItem } from './cart.model';

interface AddToCartPayload {
  productId: string;
  quantity: number;
}

interface UpdateCartItemPayload {
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepo,
    private readonly productRepo: ProductRepo,
    private readonly couponService: CouponService,
  ) {}

  private calculateItemTotal(
    price: number,
    discount: number,
    quantity: number,
  ): number {
    const discountedPrice = price * (1 - discount / 100);
    return discountedPrice * quantity;
  }

  private calculateCartTotals(items: CartItem[], couponDiscount: number = 0) {
    let subtotal = 0;
    let totalDiscount = 0;
    let itemCount = 0;

    items.forEach((item) => {
      const itemTotal = this.calculateItemTotal(
        item.price,
        item.discount,
        item.quantity,
      );
      subtotal += itemTotal;
      // Calculate discount amount: original price - discounted price
      const originalTotal = item.price * item.quantity;
      const discountedTotal = itemTotal;
      totalDiscount += originalTotal - discountedTotal;
      itemCount += item.quantity;
    });

    // Apply coupon discount
    const finalTotal = Math.max(0, subtotal - couponDiscount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      couponDiscount: Math.round(couponDiscount * 100) / 100,
      total: Math.round(finalTotal * 100) / 100,
      itemCount,
    };
  }

  async getCart(userId: string) {
    let cart = await this.cartRepo.findByUserIdWithPopulate(userId);

    if (!cart) {
      // Create empty cart if it doesn't exist
      cart = await this.cartRepo.create({
        userId: new Types.ObjectId(userId),
        items: [],
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
        itemCount: 0,
        isActive: true,
      });
      // Populate empty cart for consistency
      await cart.populate({
        path: 'items.productId',
        select: 'name price discount stock images slug isActive',
        populate: [
          { path: 'brandId', select: 'name image' },
          { path: 'categoryId', select: 'name image' },
        ],
      });
      return {
        statusCode: 200,
        message: 'Cart fetched successfully',
        data: cart,
      };
    }

    // Filter out items with inactive or out-of-stock products
    // After population, productId is an object, not ObjectId
    const validItems: any[] = [];
    let needsUpdate = false;

    for (const item of cart.items) {
      const product = item.productId as any;

      // Check if product is populated (has _id property means it's a populated document)
      const isPopulated =
        product &&
        typeof product === 'object' &&
        '_id' in product &&
        'isActive' in product;

      if (!isPopulated) {
        // If not populated, keep it (will be checked on next request or when adding)
        validItems.push(item);
        continue;
      }

      // Type guard: if we reach here, product is populated and has isActive and stock
      // Access properties with type assertion since we've verified it's populated
      if (!product.isActive || product.stock < item.quantity) {
        needsUpdate = true;
        continue; // Skip invalid items
      }

      validItems.push(item);
    }

    // Update cart if items were filtered
    if (needsUpdate) {
      // Convert back to plain objects for saving (remove populated data)
      const itemsToSave = validItems.map((item: any) => {
        const productId = item.productId?._id || item.productId;
        return {
          productId:
            productId instanceof Types.ObjectId
              ? productId
              : new Types.ObjectId(productId.toString()),
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          total: item.total,
        };
      });

      const totals = this.calculateCartTotals(
        itemsToSave,
        cart.couponDiscount || 0,
      );
      cart = await this.cartRepo.findByIdAndUpdate({
        id: cart._id.toString(),
        update: {
          items: itemsToSave,
          ...totals,
        },
        options: { new: true },
      });

      if (cart) {
        await cart.populate({
          path: 'items.productId',
          select: 'name price discount stock images slug isActive',
          populate: [
            { path: 'brandId', select: 'name image' },
            { path: 'categoryId', select: 'name image' },
          ],
        });
        if (cart.couponId) {
          await cart.populate(
            'couponId',
            'code description discountType discountValue',
          );
        }
      }
    }

    // Populate coupon if exists
    if (cart && cart.couponId) {
      await cart.populate(
        'couponId',
        'code description discountType discountValue',
      );
    }

    return {
      statusCode: 200,
      message: 'Cart fetched successfully',
      data: cart,
    };
  }

  async addToCart(userId: string, payload: AddToCartPayload) {
    const product = await this.productRepo.findById({ id: payload.productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stock < payload.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${payload.quantity}`,
      );
    }

    // Get or create cart
    let cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      cart = await this.cartRepo.create({
        userId: new Types.ObjectId(userId),
        items: [],
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
        itemCount: 0,
        isActive: true,
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === payload.productId,
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + payload.quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`,
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].total = this.calculateItemTotal(
        existingItem.price,
        existingItem.discount,
        newQuantity,
      );
    } else {
      // Add new item
      const itemTotal = this.calculateItemTotal(
        product.price,
        product.discount,
        payload.quantity,
      );
      cart.items.push({
        productId: new Types.ObjectId(payload.productId),
        quantity: payload.quantity,
        price: product.price,
        discount: product.discount,
        total: itemTotal,
      });
    }

    // Recalculate cart totals (preserve coupon discount if exists)
    const totals = this.calculateCartTotals(
      cart.items,
      cart.couponDiscount || 0,
    );

    const updatedCart = await this.cartRepo.findByIdAndUpdate({
      id: cart._id.toString(),
      update: {
        items: cart.items,
        ...totals,
      },
      options: { new: true },
    });

    if (!updatedCart) {
      throw new NotFoundException('Failed to update cart');
    }

    await updatedCart.populate({
      path: 'items.productId',
      select: 'name price discount stock images slug isActive',
      populate: [
        { path: 'brandId', select: 'name image' },
        { path: 'categoryId', select: 'name image' },
      ],
    });

    if (updatedCart.couponId) {
      await updatedCart.populate(
        'couponId',
        'code description discountType discountValue',
      );
    }

    return {
      statusCode: 200,
      message: 'Item added to cart successfully',
      data: updatedCart,
    };
  }

  async updateCartItem(
    userId: string,
    productId: string,
    payload: UpdateCartItemPayload,
  ) {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    // Check product stock
    const product = await this.productRepo.findById({ id: productId });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < payload.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${payload.quantity}`,
      );
    }

    // Update item
    const item = cart.items[itemIndex];
    cart.items[itemIndex].quantity = payload.quantity;
    cart.items[itemIndex].total = this.calculateItemTotal(
      item.price,
      item.discount,
      payload.quantity,
    );

    // Recalculate cart totals (preserve coupon discount if exists)
    const totals = this.calculateCartTotals(
      cart.items,
      cart.couponDiscount || 0,
    );

    const updatedCart = await this.cartRepo.findByIdAndUpdate({
      id: cart._id.toString(),
      update: {
        items: cart.items,
        ...totals,
      },
      options: { new: true },
    });

    if (!updatedCart) {
      throw new NotFoundException('Failed to update cart');
    }

    await updatedCart.populate({
      path: 'items.productId',
      select: 'name price discount stock images slug isActive',
      populate: [
        { path: 'brandId', select: 'name image' },
        { path: 'categoryId', select: 'name image' },
      ],
    });

    if (updatedCart.couponId) {
      await updatedCart.populate(
        'couponId',
        'code description discountType discountValue',
      );
    }

    return {
      statusCode: 200,
      message: 'Cart item updated successfully',
      data: updatedCart,
    };
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate cart totals (preserve coupon discount if exists)
    const totals = this.calculateCartTotals(
      cart.items,
      cart.couponDiscount || 0,
    );

    const updatedCart = await this.cartRepo.findByIdAndUpdate({
      id: cart._id.toString(),
      update: {
        items: cart.items,
        ...totals,
      },
      options: { new: true },
    });

    if (!updatedCart) {
      throw new NotFoundException('Failed to update cart');
    }

    await updatedCart.populate({
      path: 'items.productId',
      select: 'name price discount stock images slug isActive',
      populate: [
        { path: 'brandId', select: 'name image' },
        { path: 'categoryId', select: 'name image' },
      ],
    });

    if (updatedCart.couponId) {
      await updatedCart.populate(
        'couponId',
        'code description discountType discountValue',
      );
    }

    return {
      statusCode: 200,
      message: 'Item removed from cart successfully',
      data: updatedCart,
    };
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const clearedCart = await this.cartRepo.clearCart(userId);

    return {
      statusCode: 200,
      message: 'Cart cleared successfully',
      data: clearedCart,
    };
  }

  async getCartSummary(userId: string) {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart || cart.items.length === 0) {
      return {
        statusCode: 200,
        message: 'Cart summary',
        data: {
          itemCount: 0,
          subtotal: 0,
          totalDiscount: 0,
          couponDiscount: 0,
          total: 0,
        },
      };
    }

    const totals = this.calculateCartTotals(
      cart.items,
      cart.couponDiscount || 0,
    );

    return {
      statusCode: 200,
      message: 'Cart summary',
      data: {
        itemCount: totals.itemCount,
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        couponDiscount: totals.couponDiscount,
        total: totals.total,
        couponCode: cart.couponCode || null,
      },
    };
  }

  async applyCoupon(userId: string, couponCode: string) {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate current cart total
    const totals = this.calculateCartTotals(cart.items, 0);
    const cartTotal = totals.subtotal;

    // Validate and apply coupon
    const validation = await this.couponService.validateCoupon(
      couponCode,
      cartTotal,
      userId,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.error || 'Invalid coupon');
    }

    // Recalculate totals with coupon
    const newTotals = this.calculateCartTotals(cart.items, validation.discount);

    const updatedCart = await this.cartRepo.findByIdAndUpdate({
      id: cart._id.toString(),
      update: {
        couponId: validation.coupon._id,
        couponCode: validation.coupon.code,
        ...newTotals,
      },
      options: { new: true },
    });

    if (!updatedCart) {
      throw new NotFoundException('Failed to update cart');
    }

    await updatedCart.populate({
      path: 'items.productId',
      select: 'name price discount stock images slug isActive',
      populate: [
        { path: 'brandId', select: 'name image' },
        { path: 'categoryId', select: 'name image' },
      ],
    });

    await updatedCart.populate(
      'couponId',
      'code description discountType discountValue',
    );

    return {
      statusCode: 200,
      message: 'Coupon applied successfully',
      data: updatedCart,
    };
  }

  async removeCoupon(userId: string) {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (!cart.couponId) {
      throw new BadRequestException('No coupon applied to cart');
    }

    // Recalculate totals without coupon
    const totals = this.calculateCartTotals(cart.items, 0);

    const updatedCart = await this.cartRepo.findByIdAndUpdate({
      id: cart._id.toString(),
      update: {
        couponId: undefined,
        couponCode: undefined,
        ...totals,
      },
      options: { new: true },
    });

    if (!updatedCart) {
      throw new NotFoundException('Failed to update cart');
    }

    await updatedCart.populate({
      path: 'items.productId',
      select: 'name price discount stock images slug isActive',
      populate: [
        { path: 'brandId', select: 'name image' },
        { path: 'categoryId', select: 'name image' },
      ],
    });

    if (updatedCart.couponId) {
      await updatedCart.populate(
        'couponId',
        'code description discountType discountValue',
      );
    }

    return {
      statusCode: 200,
      message: 'Coupon removed successfully',
      data: updatedCart,
    };
  }
}
