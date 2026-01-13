import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFiles, UsePipes, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard,type AuthRequest } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/roles.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { createProductSchema } from './validation/create-product.schema';
import { updateProductSchema } from './validation/update-product.schema';
import { getMulterOptions } from 'src/common/utils/multer/upload';
import { createImagesFromFiles } from 'src/common/utils/image/image-helper';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @UsePipes(new ZodPipe(createProductSchema))
  @UseInterceptors(FilesInterceptor('images', 10, getMulterOptions('./uploads/products', { maxSize: 5 * 1024 * 1024 })))
  async create(
    @Req() req: AuthRequest,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Convert uploaded files to Image objects, or use provided images from DTO
    const images = files && files.length > 0
      ? createImagesFromFiles(files, '/uploads/products')
      : createProductDto.images || [];

    return this.productService.create({
      name: createProductDto.name,
      description: createProductDto.description,
      price: Number(createProductDto.price),
      discount: createProductDto.discount ? Number(createProductDto.discount) : 0,
      stock: Number(createProductDto.stock),
      brandId: createProductDto.brandId,
      categoryId: createProductDto.categoryId,
      createdBy: req.user._id,
      images,
    });
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.productService.findAll({
      search,
      categoryId,
      brandId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ZodPipe(updateProductSchema))
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10, getMulterOptions('./uploads/products', { maxSize: 5 * 1024 * 1024 })))
  update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthRequest,
  ) {
    // Convert uploaded files to Image objects, or use provided images from DTO
    if (files && files.length > 0) {
      updateProductDto.images = createImagesFromFiles(files, '/uploads/products');
    }
    return this.productService.update(id, updateProductDto, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Patch(':id/add-stock')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  addStock(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Req() req: AuthRequest,
  ) {
    return this.productService.addStock(id, amount, req.user);
  }

  @Patch(':id/apply-discount')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  applyDiscount(
    @Param('id') id: string,
    @Body('discount') discount: number,
    @Req() req: AuthRequest,
  ) {
    return this.productService.applyDiscount(id, discount, req.user);
  }
}
