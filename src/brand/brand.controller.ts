import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  UsePipes,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { AuthGuard, type AuthRequest } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodPipe } from 'src/common/pipes/zod.pipe';
import { createBrandSchema } from './validation/create-brand.schema';
import { updateBrandSchema } from './validation/update-brand.schema';
import { getMulterOptions } from 'src/common/utils/multer/upload';
import { createImageFromFile } from 'src/common/utils/image/image-helper';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodPipe(createBrandSchema))
  @UseInterceptors(
    FileInterceptor('image', getMulterOptions('./uploads/brands')),
  )
  async create(
    @Req() req: AuthRequest,
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const image = file
      ? createImageFromFile(file, '/uploads/brands')
      : createBrandDto.image;

    return this.brandService.create({
      name: createBrandDto.name,
      description: createBrandDto.description,
      website: createBrandDto.website,
      createdBy: req.user._id,
      image,
    });
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ZodPipe(updateBrandSchema))
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor(
      'image',
      getMulterOptions('./uploads/brands', { maxSize: 5 * 1024 * 1024 }),
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateBrandDto.image = createImageFromFile(file, '/uploads/brands');
    }
    return this.brandService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
