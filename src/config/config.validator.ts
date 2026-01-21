/**
 * Configuration Validator
 * Custom validator function for NestJS ConfigModule using Zod
 */
import { z } from 'zod';
import { configValidationSchema } from './config.schema';

/**
 * Validates environment variables using Zod schema
 * Compatible with NestJS ConfigModule validationSchema option
 */
export function validate(config: Record<string, unknown>) {
  try {
    const result = configValidationSchema.parse(config);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      const formattedErrors = errorMessages
        .map((e) => `  - ${e.path}: ${e.message}`)
        .join('\n');

      throw new Error(`Configuration validation failed:\n${formattedErrors}`);
    }
    throw error;
  }
}
