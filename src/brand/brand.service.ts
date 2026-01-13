import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BrandRepo } from './brand.repo';
import { Types } from 'mongoose';
import fs from 'fs/promises';
import { Image } from 'src/common/schemas/image.schema';

interface CreateBrandPayload {
  name: string;
  description?: string;
  website?: string;
  createdBy: Types.ObjectId;
  image?: Image;
}

interface UpdateBrandPayload {
  name?: string;
  description?: string;
  website?: string;
  image?: Image;
}

@Injectable()
export class BrandService {
  constructor(private readonly brandRepo: BrandRepo) {}

  async create(payload: CreateBrandPayload) {
    const brand = await this.brandRepo.create({
      name: payload.name,
      createdBy: payload.createdBy,
      image: payload.image,
    });

    return {
      statusCode: 201,
      message: 'Brand created successfully',
      data: brand,
    };
  }

  async findAll() {
    const brands = await this.brandRepo.find({});
    return {
      statusCode: 200,
      message: 'Brands fetched successfully',
      data: brands,
    };
  }

  async findOne(id: string) {
    const brand = await this.brandRepo.findById({ id });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return {
      statusCode: 200,
      message: 'Brand fetched successfully',
      data: brand,
    };
  }

  async update(id: string, payload: UpdateBrandPayload) {

    const brand = await this.brandRepo.findById({ id });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (payload.name && payload.name === brand.name) {
      throw new BadRequestException('No changes detected in name');
    }

    // Delete old image if new one is provided
    if (payload.image && brand.image && brand.image.filename) {
        await fs.unlink(`./uploads/brands/${brand.image.filename}`).catch((err)=>console.log('Error deleting file:', err))
    }

    const updated = await this.brandRepo.findByIdAndUpdate({
      id,
      update: payload,
      options: { new: true },
    });

    if (!updated) {
      throw new NotFoundException('Brand not found');
    }

    return {
      statusCode: 200,
      message: 'Brand updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const deleted = await this.brandRepo.findByIdAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException('Brand not found');
    }

    return {
      statusCode: 200,
      message: 'Brand deleted successfully',
      data: deleted,
    };
  }
}
