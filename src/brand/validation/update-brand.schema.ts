import { createBrandSchema } from './create-brand.schema';

export const updateBrandSchema = createBrandSchema.partial();
