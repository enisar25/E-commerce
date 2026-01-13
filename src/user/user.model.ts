import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { UserRole, DEFAULT_ROLE } from "src/common/enums/roles.enum";
import { Product } from "src/product/product.model";

@Schema({
    timestamps: true,
})
export class User {
    @Prop({
        type: String,
        required: true,
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
    })
    name: string;

    @Prop({
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        index: true,
    })
    email: string;

    @Prop({
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters'],
        select: false, // Exclude password from queries by default
    })
    password: string; 

    @Prop({
        type: Number,
        min: [13, 'Age must be at least 13'],
        max: [120, 'Age cannot exceed 120'],
    })
    age?: number;

    @Prop({
        type: Boolean,
        default: false,
        index: true,
    })
    isVerified: boolean;

    @Prop({
        type: String,
        enum: Object.values(UserRole),
        default: DEFAULT_ROLE,
        index: true,
    })
    role: UserRole;

    @Prop({
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
    })
    bio?: string;

    @Prop({
        type: String,
        maxlength: [200, 'Avatar URL cannot exceed 200 characters'],
    })
    avatar?: string;

    @Prop({
        type: [Types.ObjectId],
        ref: 'Product',
        default: [],
    })
    favorites?: Types.ObjectId[];
}

export const userSchema = SchemaFactory.createForClass(User);

export const UserModel = MongooseModule.forFeature([
    {
        name: User.name,
        schema: userSchema,
    },
]);

export type HUser = HydratedDocument<User>;


