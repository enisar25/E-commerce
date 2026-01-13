/**
 * Application Bootstrap
 * Main entry point for the NestJS application
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application instance
    const app = await NestFactory.create(AppModule, {
      rawBody: true, // Required for Stripe webhook signature verification
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);

    // Enable CORS with configuration
    const corsOrigins = configService.get<string | string[]>('cors.origin');
    app.enableCors({
      origin: corsOrigins === '*' ? '*' : corsOrigins,
      credentials: configService.get<boolean>('cors.credentials'),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Set global API prefix
    const apiPrefix = configService.get<string>('apiPrefix') || 'api';
    app.setGlobalPrefix(apiPrefix);

    // Global validation pipe with strict settings
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable implicit type conversion
        },
        disableErrorMessages: configService.get<string>('nodeEnv') === 'production', // Hide error details in production
      }),
    );

    // Start the application
    const port = configService.get<number>('port') || 3000;
    const nodeEnv = configService.get<string>('nodeEnv') || 'development';

    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
    logger.log(`📦 Environment: ${nodeEnv}`);
    logger.log(`🌍 CORS enabled for: ${corsOrigins === '*' ? 'all origins' : corsOrigins}`);
  } catch (error) {
    logger.error('❌ Error starting application', error);
    process.exit(1);
  }
}

bootstrap();
