import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Image {
  @Prop({
    type: String,
    required: true,
  })
  url: string; // Full URL or path

  @Prop({
    type: String,
    required: false,
  })
  filename?: string; // Original filename

  @Prop({
    type: String,
    required: false,
  })
  alt?: string; // Alt text for accessibility

  @Prop({
    type: String,
    required: false,
  })
  mimeType?: string; // Image MIME type

  @Prop({
    type: Number,
    required: false,
  })
  size?: number; // File size in bytes
}

export const imageSchema = SchemaFactory.createForClass(Image);
export type ImageDocument = HydratedDocument<Image>;
