import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../database/repositories/base.repository";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Brand } from "./brand.model";

@Injectable()
export class BrandRepo extends BaseRepository<Brand>{
    constructor(@InjectModel(Brand.name) private readonly brandModel:Model<Brand>){
        super(brandModel)
    }



}