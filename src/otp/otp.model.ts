import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum OTPTypeEnum {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

@Schema({
  timestamps: true,
})
export class OTP {
  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  otp: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(OTPTypeEnum),
    index: true,
  })
  type: OTPTypeEnum;

  @Prop({
    type: Date,
    required: true,
  })
  expiresAt: Date;
}

export type HOTP = HydratedDocument<OTP>;

export const otpSchema = SchemaFactory.createForClass(OTP);

// One OTP per user per type
otpSchema.index({ userId: 1, type: 1 }, { unique: true });

// TTL index - Document will be deleted when expiresAt < now
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPModel = MongooseModule.forFeature([
  {
    name: OTP.name,
    schema: otpSchema,
  },
]);
