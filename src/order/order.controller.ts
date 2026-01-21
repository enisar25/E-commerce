import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UsePipes,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard, type AuthRequest } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/roles.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { createOrderSchema, updateOrderStatusSchema } from './validation';
import { OrderStatus } from './order.model';

@Controller('order')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(
    @Req() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.orderService.findAll(
      req.user._id.toString(),
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      status as OrderStatus | undefined,
    );
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(
    @Req() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.findAllAdmin(
      req.user,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      status as OrderStatus | undefined,
      userId,
      startDate,
      endDate,
    );
  }

  @Get('stats')
  getOrderStats(@Req() req: AuthRequest) {
    return this.orderService.getOrderStats(req.user._id.toString());
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminOrderStats() {
    return this.orderService.getOrderStats();
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.orderService.findOne(
      id,
      req.user._id.toString(),
      req.user.role,
    );
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodPipe(updateOrderStatusSchema))
  updateStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto, req.user);
  }

  @Patch(':id/cancel')
  @UsePipes(new ZodPipe(updateOrderStatusSchema.partial()))
  cancelOrder(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason?: string,
  ) {
    return this.orderService.cancelOrder(
      id,
      req.user._id.toString(),
      cancellationReason,
    );
  }
}

