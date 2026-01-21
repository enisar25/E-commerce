import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderRepo } from './order.repo';
import { ProductRepo } from 'src/product/product.repo';
import { Types } from 'mongoose';
import { OrderStatus } from './order.model';
import { HUser } from 'src/user/user.model';
import { UserRole } from 'src/common/enums/roles.enum';

interface UpdateOrderStatusPayload {
  status: OrderStatus;
  cancellationReason?: string;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly productRepo: ProductRepo,
  ) {}

  async findAll(
    userId: string,
    page?: number,
    limit?: number,
    status?: OrderStatus,
  ) {
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
    if (
      payload.status === OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      for (const item of order.items) {
        const product = await this.productRepo.findById({
          id: item.productId.toString(),
        });
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
      const product = await this.productRepo.findById({
        id: item.productId.toString(),
      });
      if (product) {
        await this.productRepo.findByIdAndUpdate({
          id: product._id.toString(),
          update: { stock: product.stock + item.quantity },
          options: { new: true },
        });
      }
    }

    const updated = await this.orderRepo.updateStatus(
      id,
      OrderStatus.CANCELLED,
      {
        cancellationReason,
      },
    );

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
