import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../database/repositories/base.repository";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Product } from "./product.model";

@Injectable()
export class ProductRepo extends BaseRepository<Product>{
    constructor(@InjectModel(Product.name) private readonly productModel:Model<Product>){
        super(productModel)
    }

    async findWithPopulate(filter: any = {}, options: any = {}) {
        let query = this.productModel.find(filter);
        
        if (options.populate) {
            query = query.populate(options.populate);
        }
        
        if (options.skip) {
            query = query.skip(options.skip);
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        if (options.sort) {
            query = query.sort(options.sort);
        }
        
        return query.exec();
    }

    async countDocuments(filter: any = {}) {
        return this.productModel.countDocuments(filter);
    }
}
