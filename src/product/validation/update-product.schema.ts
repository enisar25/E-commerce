import { createProductSchema } from "./create-product.schema";

export const updateProductSchema = createProductSchema.partial();
