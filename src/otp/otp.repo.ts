import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../database/repositories/base.repository";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { OTP, OTPTypeEnum } from "./otp.model";

@Injectable()
export class OTPRepo extends BaseRepository<OTP>{
    constructor(@InjectModel(OTP.name) private readonly otpModel:Model<OTP>){
        super(otpModel)
    }

  findByUserAndType(userId: Types.ObjectId, type: OTPTypeEnum) {
    return this.otpModel.findOne({ userId, type });
  }


}