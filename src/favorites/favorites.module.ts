import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { UserModel } from 'src/user/user.model';
import { ProductModel } from 'src/product/product.model';
import { UserRepo } from 'src/user/user.repo';
import { ProductRepo } from 'src/product/product.repo';
import { JwtGlobalModule } from 'src/common/modules/jwt.module';

@Module({
  imports: [UserModel, ProductModel, JwtGlobalModule],
  controllers: [FavoritesController],
  providers: [FavoritesService, UserRepo, ProductRepo],
})
export class FavoritesModule {}
