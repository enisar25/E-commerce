import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UsePipes,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { AuthGuard, type AuthRequest } from 'src/common/guards/auth.guard';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { checkoutSchema } from './validation';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('checkout')
@UseGuards(AuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @UsePipes(new ZodPipe(checkoutSchema))
  async createCheckout(
    @Req() req: AuthRequest,
    @Body() checkoutDto: CheckoutDto,
  ) {
    return this.checkoutService.createCheckout(
      req.user._id.toString(),
      checkoutDto as any,
    );
  }
}
