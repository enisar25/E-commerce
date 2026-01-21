import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryRepo } from './category.repo';
import { Types } from 'mongoose';
import fs from 'fs/promises';
import { Image } from 'src/common/schemas/image.schema';

interface CreateCategoryPayload {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  image?: Image;
}

interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  image?: Image;
}

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepo) {}

  async create(payload: CreateCategoryPayload) {
    const isExisting = await this.categoryRepo.findOne({
      filter: { name: payload.name },
    });
    if (isExisting) {
      throw new BadRequestException('Category with this name already exists');
    }

    const category = await this.categoryRepo.create({
      name: payload.name,
      createdBy: payload.createdBy,
      image: payload.image,
    });

    return {
      statusCode: 201,
      message: 'Category created successfully',
      data: category,
    };
  }

  async findAll() {
    const categories = await this.categoryRepo.find({});
    return {
      statusCode: 200,
      message: 'Categories fetched successfully',
      data: categories,
    };
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findById({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return {
      statusCode: 200,
      message: 'Category fetched successfully',
      data: category,
    };
  }

  async update(id: string, payload: UpdateCategoryPayload) {
    const category = await this.categoryRepo.findById({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (payload.name && payload.name === category.name) {
      throw new BadRequestException('No changes detected in name');
    }

    // Delete old image if new one is provided
    if (payload.image && category.image && category.image.filename) {
      await fs
        .unlink(`./uploads/categories/${category.image.filename}`)
        .catch((err) => console.log('Error deleting file:', err));
    }

    const updated = await this.categoryRepo.findByIdAndUpdate({
      id,
      update: payload,
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('Category not found');
    }

    return {
      statusCode: 200,
      message: 'Category updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const deleted = await this.categoryRepo.findByIdAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException('Category not found');
    }

    return {
      statusCode: 200,
      message: 'Category deleted successfully',
      data: deleted,
    };
  }

  async addBrandToCategory(categoryId: string, brandId: string) {
    const category = await this.categoryRepo.addBrandToCategory(
      categoryId,
      new Types.ObjectId(brandId),
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      statusCode: 200,
      message: 'Brand added to category successfully',
      data: category,
    };
  }

  async removeBrandFromCategory(categoryId: string, brandId: string) {
    const category = await this.categoryRepo.removeBrandFromCategory(
      categoryId,
      new Types.ObjectId(brandId),
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      statusCode: 200,
      message: 'Brand removed from category successfully',
      data: category,
    };
  }
}
