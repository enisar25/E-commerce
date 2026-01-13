import { Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import {AuthGuard, type AuthRequest } from 'src/common/guards/auth.guard';
import { Types } from 'mongoose';

@Controller('favorites')
export class FavoritesController {
    constructor(
        private readonly favoritesService: FavoritesService
    ) { }

    @Patch('favourite-toggle/:id')
    @UseGuards(AuthGuard)
    async favouriteToggle(@Req() req:AuthRequest) {
        const user = req.user
        const productId = req.params.id as unknown as Types.ObjectId;
        return this.favoritesService.addToFavorites(user._id, productId);

    }


}
