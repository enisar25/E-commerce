import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UsePipes,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { AuthGuard, type AuthRequest } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/roles.enum';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { createCouponSchema, applyCouponSchema } from './validation';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodPipe(createCouponSchema))
  create(@Req() req: AuthRequest, @Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create({
      ...createCouponDto,
      validFrom: new Date(createCouponDto.validFrom),
      validTo: new Date(createCouponDto.validTo),
      createdBy: req.user._id,
    });
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.couponService.findAll(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.couponService.findByCode(code);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const payload: any = { ...updateCouponDto };
    if (updateCouponDto.validFrom) {
      payload.validFrom = new Date(updateCouponDto.validFrom);
    }
    if (updateCouponDto.validTo) {
      payload.validTo = new Date(updateCouponDto.validTo);
    }
    return this.couponService.update(id, payload, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.couponService.remove(id, req.user);
  }

  @Post('validate')
  @UseGuards(AuthGuard)
  @UsePipes(new ZodPipe(applyCouponSchema))
  validateCoupon(
    @Req() req: AuthRequest,
    @Body() applyCouponDto: ApplyCouponDto,
    @Query('cartTotal') cartTotal?: string,
  ) {
    const total = cartTotal ? Number(cartTotal) : 0;
    return this.couponService.applyCouponToCart(
      applyCouponDto.code,
      total,
      req.user._id.toString(),
    );
  }
}

