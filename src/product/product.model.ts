import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { createSlug } from "src/common/utils/createSlug";
import { imageSchema, Image } from "src/common/schemas/image.schema";

@Schema({
    timestamps: true,
})
export class Product {
    @Prop({
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'Product name must be at least 3 characters'],
        maxlength: [200, 'Product name cannot exceed 200 characters'],
    })
    name: string;

    @Prop({
        type:String,
        required:true,
        unique:true,
        index:true
    }) 
    slug:string

    @Prop({
        type:String,
        required:true,
        trim:true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    })
    description:string

    @Prop({
        type:Number,
        required:true,
        min: [0.01, 'Price must be greater than 0'],
        max: [1000000, 'Price cannot exceed 1,000,000']
    })
    price:number

    @Prop({
        type:Number,
        default:0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    })
    discount:number

    @Prop({
        type:Number,
        required:true,
        min: [0, 'Stock cannot be negative'],
        default: 0
    })
    stock:number

    @Prop({
        type: [imageSchema],
        default: [],
        validate: {
            validator: function(images: Image[]) {
                return images.length <= 10; // Max 10 images per product
            },
            message: 'Product cannot have more than 10 images',
        },
    })
    images: Image[];

    @Prop({
        type: Types.ObjectId,
        ref: 'Brand',
        required: true,
        index: true,
    })
    brandId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true,
    })
    categoryId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    })
    createdBy: Types.ObjectId;

    @Prop({
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
    })
    rating: number;

    @Prop({
        type: Number,
        default: 0,
        min: [0, 'Review count cannot be negative'],
    })
    reviewCount: number;

    @Prop({
        type: Boolean,
        default: true,
        index: true,
    })
    isActive: boolean;

    @Prop({
        type: Number,
        default: 0,
        min: [0, 'Views cannot be negative'],
    })
    views: number;
}

export const productSchema = SchemaFactory.createForClass(Product);

// Generate slug before saving if name is modified
(productSchema as any).pre('save', function (next: any) {
    const doc = this as any;
    if (doc.isModified('name') && !doc.isModified('slug')) {
        doc.slug = createSlug(doc.name);
    }
    next();
});

export const ProductModel = MongooseModule.forFeature([
    {
        name: Product.name,
        schema: productSchema,
    },
]);

export type HProduct = HydratedDocument<Product>;
