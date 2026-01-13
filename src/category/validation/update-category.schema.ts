import { createCategorySchema } from "./create-category.schema";

export const updateCategorySchema = createCategorySchema.partial();
