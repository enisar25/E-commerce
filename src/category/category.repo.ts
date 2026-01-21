import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../database/repositories/base.repository';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './category.model';

@Injectable()
export class CategoryRepo extends BaseRepository<Category> {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {
    super(categoryModel);
  }

  async addBrandToCategory(
    categoryId: string | Types.ObjectId,
    brandId: Types.ObjectId,
  ) {
    return this.categoryModel.findByIdAndUpdate(
      categoryId,
      { $addToSet: { brands: brandId } },
      { new: true },
    );
  }

  async removeBrandFromCategory(
    categoryId: string | Types.ObjectId,
    brandId: Types.ObjectId,
  ) {
    return this.categoryModel.findByIdAndUpdate(
      categoryId,
      { $pull: { brands: brandId } },
      { new: true },
    );
  }
}
