import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UsePipes,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard,type AuthRequest } from 'src/common/guards/auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApplyCouponDto } from 'src/coupon/dto/apply-coupon.dto';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { addToCartSchema, updateCartItemSchema } from './validation';
import { applyCouponSchema } from 'src/coupon/validation';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: AuthRequest) {
    return this.cartService.getCart(req.user._id.toString());
  }

  @Get('summary')
  getCartSummary(@Req() req: AuthRequest) {
    return this.cartService.getCartSummary(req.user._id.toString());
  }

  @Post('add')
  @UsePipes(new ZodPipe(addToCartSchema))
  addToCart(@Req() req: AuthRequest, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user._id.toString(), addToCartDto);
  }

  @Patch('item/:productId')
  @UsePipes(new ZodPipe(updateCartItemSchema))
  updateCartItem(
    @Req() req: AuthRequest,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      req.user._id.toString(),
      productId,
      updateCartItemDto,
    );
  }

  @Delete('item/:productId')
  removeFromCart(@Req() req: AuthRequest, @Param('productId') productId: string) {
    return this.cartService.removeFromCart(req.user._id.toString(), productId);
  }

  @Delete('clear')
  clearCart(@Req() req: AuthRequest) {
    return this.cartService.clearCart(req.user._id.toString());
  }

  @Post('apply-coupon')
  @UsePipes(new ZodPipe(applyCouponSchema))
  applyCoupon(@Req() req: AuthRequest, @Body() applyCouponDto: ApplyCouponDto) {
    return this.cartService.applyCoupon(req.user._id.toString(), applyCouponDto.code);
  }

  @Delete('remove-coupon')
  removeCoupon(@Req() req: AuthRequest) {
    return this.cartService.removeCoupon(req.user._id.toString());
  }
}

