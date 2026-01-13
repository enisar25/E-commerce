import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderRepo } from './order.repo';
import { CartRepo } from 'src/cart/cart.repo';
import { ProductRepo } from 'src/product/product.repo';
import { CouponRepo } from 'src/coupon/coupon.repo';
import { Types } from 'mongoose';
import { OrderStatus, OrderItem, ShippingAddress } from './order.model';
import { generateOrderNumber } from 'src/common/utils/order-number';
import { HUser } from 'src/user/user.model';
import { UserRole } from 'src/common/enums/roles.enum';

interface CreateOrderPayload {
  shippingAddress: ShippingAddress;
  shippingCost?: number;
  notes?: string;
}

interface UpdateOrderStatusPayload {
  status: OrderStatus;
  cancellationReason?: string;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly cartRepo: CartRepo,
    private readonly productRepo: ProductRepo,
    private readonly couponRepo: CouponRepo,
  ) {}

  async create(userId: string, payload: CreateOrderPayload) {
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
      const product = await this.productRepo.findById({ id: cartItem.productId.toString() });

      if (!product) {
        throw new NotFoundException(`Product ${String(cartItem.productId)} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is no longer available`);
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

    // Create order
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
    });

    // Update product stock
    for (const item of orderItems) {
      const product = await this.productRepo.findById({ id: item.productId.toString() });
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

    // Populate order
    const populatedOrder = await this.orderRepo.findByIdWithPopulate(order._id.toString());

    return {
      statusCode: 201,
      message: 'Order created successfully',
      data: populatedOrder,
    };
  }

  async findAll(userId: string, page?: number, limit?: number, status?: OrderStatus) {
    const pageNum = page ? Math.max(1, page) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, limit)) : 10;

    const result = await this.orderRepo.findByUserId(userId, {
      page: pageNum,
      limit: limitNum,
      status,
    });

    return {
      statusCode: 200,
      message: 'Orders fetched successfully',
      data: result,
    };
  }

  async findAllAdmin(
    admin: HUser,
    page?: number,
    limit?: number,
    status?: OrderStatus,
    userId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view all orders');
    }

    const pageNum = page ? Math.max(1, page) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, limit)) : 10;

    const result = await this.orderRepo.findAll({
      page: pageNum,
      limit: limitNum,
      status,
      userId,
      startDate,
      endDate,
    });

    return {
      statusCode: 200,
      message: 'Orders fetched successfully',
      data: result,
    };
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const order = await this.orderRepo.findByIdWithPopulate(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Users can only view their own orders, admins can view all
    if (userRole !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return {
      statusCode: 200,
      message: 'Order fetched successfully',
      data: order,
    };
  }

  async updateStatus(
    id: string,
    payload: UpdateOrderStatusPayload,
    admin: HUser,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update order status');
    }

    const order = await this.orderRepo.findById({ id });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses.includes(payload.status)) {
      throw new BadRequestException(
        `Cannot change status from ${order.status} to ${payload.status}`,
      );
    }

    // If cancelling, restore product stock
    if (payload.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        const product = await this.productRepo.findById({ id: item.productId.toString() });
        if (product) {
          await this.productRepo.findByIdAndUpdate({
            id: product._id.toString(),
            update: { stock: product.stock + item.quantity },
            options: { new: true },
          });
        }
      }
    }

    const updated = await this.orderRepo.updateStatus(id, payload.status, {
      cancellationReason: payload.cancellationReason,
    });

    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    const populatedOrder = await this.orderRepo.findByIdWithPopulate(id);

    return {
      statusCode: 200,
      message: 'Order status updated successfully',
      data: populatedOrder,
    };
  }

  async cancelOrder(id: string, userId: string, cancellationReason?: string) {
    const order = await this.orderRepo.findById({ id });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Only allow cancellation if order is pending or confirmed
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status ${order.status}. Only PENDING or CONFIRMED orders can be cancelled.`,
      );
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await this.productRepo.findById({ id: item.productId.toString() });
      if (product) {
        await this.productRepo.findByIdAndUpdate({
          id: product._id.toString(),
          update: { stock: product.stock + item.quantity },
          options: { new: true },
        });
      }
    }

    const updated = await this.orderRepo.updateStatus(id, OrderStatus.CANCELLED, {
      cancellationReason,
    });

    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    const populatedOrder = await this.orderRepo.findByIdWithPopulate(id);

    return {
      statusCode: 200,
      message: 'Order cancelled successfully',
      data: populatedOrder,
    };
  }

  async getOrderStats(userId?: string) {
    const stats = await this.orderRepo.getOrderStats(
      userId ? new Types.ObjectId(userId) : undefined,
    );

    return {
      statusCode: 200,
      message: 'Order statistics',
      data: stats,
    };
  }
}

