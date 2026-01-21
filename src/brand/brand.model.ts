import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { createSlug } from 'src/common/utils/createSlug';
import { imageSchema, Image } from 'src/common/schemas/image.schema';

@Schema({
  timestamps: true,
})
export class Brand {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [2, 'Brand name must be at least 2 characters'],
    maxlength: [100, 'Brand name cannot exceed 100 characters'],
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  slug: string;

  @Prop({
    type: imageSchema,
    required: false,
  })
  image?: Image;

  @Prop({
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  })
  description?: string;

  @Prop({
    type: String,
    maxlength: [200, 'Website URL cannot exceed 200 characters'],
    match: [/^https?:\/\/.+/, 'Website must be a valid URL'],
  })
  website?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Product count cannot be negative'],
  })
  productCount: number;
}

export const brandSchema = SchemaFactory.createForClass(Brand);

// Generate slug before saving if name is modified
(brandSchema as any).pre('save', function (next: any) {
  const doc = this;
  if (doc.isModified('name') && !doc.isModified('slug')) {
    doc.slug = createSlug(doc.name);
  }
  next();
});

export const BrandModel = MongooseModule.forFeature([
  {
    name: Brand.name,
    schema: brandSchema,
  },
]);

export type HBrand = HydratedDocument<Brand>;
