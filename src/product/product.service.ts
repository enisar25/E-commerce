import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductRepo } from './product.repo';
import { Types } from 'mongoose';
import fs from 'fs/promises';
import { HUser } from 'src/user/user.model';
import { UserRole } from 'src/common/enums/roles.enum';
import { Image } from 'src/common/schemas/image.schema';

interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  discount?: number;
  stock: number;
  brandId: Types.ObjectId;
  categoryId: Types.ObjectId;
  createdBy: Types.ObjectId;
  images?: Image[];
}

interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  discount?: number;
  stock?: number;
  brandId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  images?: Image[];
  isActive?: boolean;
}

@Injectable()
export class ProductService {
  constructor(private readonly productRepo: ProductRepo) {}

  async create(payload: CreateProductPayload) {

    const isExisting = await this.productRepo.findOne({filter:{ name: payload.name }});
    if (isExisting) {
      throw new BadRequestException('Product with this name already exists');
    }

    const product = await this.productRepo.create({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      discount: payload.discount,
      stock: payload.stock,
      brandId: payload.brandId,
      categoryId: payload.categoryId,
      createdBy: payload.createdBy,
      images: payload.images,
    });

    return {
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    };
  }

  async findAll(query?: {
    search?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const filter: any = { isActive: true };

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query?.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query?.brandId) {
      filter.brandId = new Types.ObjectId(query.brandId);
    }

    if (query?.minPrice !== undefined || query?.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) {
        filter.price.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        filter.price.$lte = query.maxPrice;
      }
    }

    const page = query?.page ? Math.max(1, query.page) : 1;
    const limit = query?.limit ? Math.max(1, Math.min(100, query.limit)) : 10;
    const skip = (page - 1) * limit;

    const sort: any = {};
    if (query?.sortBy) {
      sort[query.sortBy] = query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by newest
    }

    const [products, total] = await Promise.all([
      this.productRepo.findWithPopulate(filter, {
        skip,
        limit,
        sort,
        populate: [
          { path: 'brandId', select: 'name image' },
          { path: 'categoryId', select: 'name image' },
          { path: 'createdBy', select: 'name email' },
        ],
      }),
      this.productRepo.countDocuments(filter),
    ]);

    return {
      statusCode: 200,
      message: 'Products fetched successfully',
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productRepo.findById({ id });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    // Populate related fields
    await product.populate('brandId', 'name image');
    await product.populate('categoryId', 'name image');
    await product.populate('createdBy', 'name email');
    
    return {
      statusCode: 200,
      message: 'Product fetched successfully',
      data: product,
    };
  }

  async update(id: string, payload: UpdateProductPayload, user: HUser) {

    const product = await this.productRepo.findById({ id });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user is admin or the product owner
    if (user.role !== UserRole.ADMIN && product.createdBy.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Delete old images if new ones are provided
    if (payload.images && payload.images.length > 0 && product.images && product.images.length > 0) {
        for (const image of product.images) {
            if (image.filename) {
                await fs.unlink(`./uploads/products/${image.filename}`).catch((err)=>console.log('Error deleting file:', err))
            }
        }
    }

    const updated = await this.productRepo.findByIdAndUpdate({
      id,
      update: payload,
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    return {
      statusCode: 200,
      message: 'Product updated successfully',
      data: updated,
    };
  }

  async addStock(id: string, amount: number, user: HUser) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive integer');
    }

    const product = await this.productRepo.findById({ id });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user is admin or the product owner
    if (user.role !== UserRole.ADMIN && product.createdBy.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only update stock for your own products');
    }

    const updated = await this.productRepo.findByIdAndUpdate({
      id,
      update: { stock: (product.stock || 0) + amount },
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    return {
      statusCode: 200,
      message: 'Stock updated successfully',
      data: updated,
    };
  }

  async applyDiscount(id: string, discount: number, user: HUser) {
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      throw new BadRequestException('Discount must be a number between 0 and 100');
    }

    const product = await this.productRepo.findById({ id });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user is admin or the product owner
    if (user.role !== UserRole.ADMIN && product.createdBy.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only apply discounts to your own products');
    }

    if (product.discount === discount) {
      throw new BadRequestException('No changes detected in discount');
    }

    const updated = await this.productRepo.findByIdAndUpdate({
      id,
      update: { discount },
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    return {
      statusCode: 200,
      message: 'Discount applied successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const deleted = await this.productRepo.findByIdAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException('Product not found');
    }

    return {
      statusCode: 200,
      message: 'Product deleted successfully',
      data: deleted,
    };
  }
}
