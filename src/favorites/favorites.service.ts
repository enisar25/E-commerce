import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductRepo } from 'src/product/product.repo';
import { UserRepo } from 'src/user/user.repo';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly productRepo: ProductRepo,
  ) {}

  async addToFavorites(userId: Types.ObjectId, productId: Types.ObjectId) {
    const user = await this.userRepo.findById({ id: userId });
    const product = await this.productRepo.findById({ id: productId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const index = user.favorites?.indexOf(productId);
    if (index === -1 || index === undefined) {
      user.favorites?.push(productId);
      await this.userRepo.findByIdAndUpdate({
        id: userId,
        update: { favorites: user.favorites },
        options: { new: true },
      });
    } else {
      user.favorites?.splice(index, 1);
      await this.userRepo.findByIdAndUpdate({
        id: userId,
        update: { favorites: user.favorites },
        options: { new: true },
      });
    }

    return {
      statusCode: 200,
      message: 'Favorites updated successfully',
      data: user.favorites,
    };
  }
}
