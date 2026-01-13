import { Injectable } from "@nestjs/common";
import { User } from "./user.model";
import { BaseRepository } from "../database/repositories/base.repository";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class UserRepo extends BaseRepository<User>{
    constructor(@InjectModel(User.name) private readonly userModel:Model<User>){
        super(userModel)
    }

    async findByEmail(email:string){
        return this.userModel.findOne({email});
    }

    async verifyUserEmail(userId: string | Types.ObjectId) {
        const result = await this.userModel.findByIdAndUpdate(
            userId,
            { isVerified: true },
            { new: true },
        );
        return result !== null;
    }



}