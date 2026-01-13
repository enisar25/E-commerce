import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, UsePipes } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard,type AuthRequest } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { createCategorySchema } from './validation/create-category.schema';
import { updateCategorySchema } from './validation/update-category.schema';
import { getMulterOptions } from 'src/common/utils/multer/upload';
import { createImageFromFile } from 'src/common/utils/image/image-helper';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodPipe(createCategorySchema))
  @UseInterceptors(FileInterceptor('image', getMulterOptions('./uploads/categories', { maxSize: 5 * 1024 * 1024 })))
  async create( 
    @Req() req: AuthRequest,
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const image = file
      ? createImageFromFile(file, '/uploads/categories')
      : createCategoryDto.image;

    return this.categoryService.create({
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      createdBy: req.user._id,
      image,
    });
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ZodPipe(updateCategorySchema))
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image', getMulterOptions('./uploads/categories', { maxSize: 5 * 1024 * 1024 })))
  update(
    @Param('id') id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateCategoryDto.image = createImageFromFile(file, '/uploads/categories');
    }
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Post(':categoryId/brands/:brandId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  addBrandToCategory(
    @Param('categoryId') categoryId: string,
    @Param('brandId') brandId: string,
  ) {
    return this.categoryService.addBrandToCategory(categoryId, brandId);
  }

  @Delete(':categoryId/brands/:brandId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeBrandFromCategory(
    @Param('categoryId') categoryId: string,
    @Param('brandId') brandId: string,
  ) {
    return this.categoryService.removeBrandFromCategory(categoryId, brandId);
  }
}
