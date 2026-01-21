/**
 * Application Root Module
 * Configures all feature modules, global providers, and application-level settings
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OTPModule } from './otp/otp.module';
import { BrandModule } from './brand/brand.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { CouponModule } from './coupon/coupon.module';
import { OrderModule } from './order/order.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PaymentModule } from './payment/payment.module';

// Common Modules
import { SuccessHandlerInterceptor } from './common/interceptors/success-handler.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtGlobalModule } from './common/modules/jwt.module';
import configuration from './config/configuration';
import { validate } from './config/config.validator';

@Module({
  imports: [
    // Configuration Module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),

    // Database Module
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        const options = configService.get('database.options');

        return {
          uri,
          ...options,
          onConnectionCreate: (connection: Connection) => {
            connection.on('connected', () =>
              console.log('✅ Database connected'),
            );
            connection.on('open', () =>
              console.log('✅ Database connection open'),
            );
            connection.on('disconnected', () =>
              console.log('⚠️  Database disconnected'),
            );
            connection.on('reconnected', () =>
              console.log('✅ Database reconnected'),
            );
            connection.on('disconnecting', () =>
              console.log('⚠️  Database disconnecting'),
            );
            connection.on('error', (error) =>
              console.error('❌ Database error:', error),
            );
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),

    // Global Modules
    JwtGlobalModule,

    // Feature Modules
    AuthModule,
    OTPModule,
    UserModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    CartModule,
    CouponModule,
    OrderModule,
    FavoritesModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessHandlerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
