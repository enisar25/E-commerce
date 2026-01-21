# Architecture Documentation

## Overview

This e-commerce backend is built using **NestJS**, a progressive Node.js framework for building efficient and scalable server-side applications. The architecture follows clean code principles, separation of concerns, and modular design.

## Architecture Patterns

### 1. Modular Architecture

The application is organized into feature modules, each containing:
- **Controller** - Handles HTTP requests and responses
- **Service** - Contains business logic
- **Model** - Database schema definition
- **Repository** - Data access layer
- **DTOs** - Data Transfer Objects for request/response
- **Validation Schemas** - Zod schemas for input validation

### 2. Repository Pattern

All database operations go through repositories that extend `BaseRepository`:

```typescript
export abstract class BaseRepository<T> {
  // Common CRUD operations
  async find()
  async findOne()
  async findById()
  async create()
  async update()
  async delete()
  async countDocuments()
  async exists()
}
```

This provides:
- Consistent data access patterns
- Easy testing (mock repositories)
- Database abstraction

### 3. Dependency Injection

NestJS's built-in DI container manages all dependencies:
- Services are injected into controllers
- Repositories are injected into services
- Configuration is injected via `ConfigService`

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/                # Data Transfer Objects
│   │   ├── signup.dto.ts
│   │   ├── login.dto.ts
│   │   └── ...
│   ├── validation/         # Zod validation schemas
│   │   ├── signup.schema.ts
│   │   └── ...
│   ├── auth.controller.ts  # HTTP endpoints
│   ├── auth.service.ts      # Business logic
│   └── auth.module.ts       # Module definition
│
├── user/                    # User management
├── product/                 # Product management
├── category/               # Category management
├── brand/                  # Brand management
├── cart/                   # Shopping cart
├── order/                  # Order management
├── coupon/                 # Coupon system
├── favorites/              # Favorites/wishlist
├── otp/                    # OTP service
│
├── common/                 # Shared code
│   ├── guards/             # Route guards
│   │   ├── auth.guard.ts  # JWT authentication guard
│   │   └── roles.guard.ts # Role-based access guard
│   ├── interceptors/        # Response interceptors
│   │   ├── success-handler.interceptor.ts
│   │   └── morgan.interceptor.ts
│   ├── filters/            # Exception filters
│   │   └── http-exception.filter.ts
│   ├── pipes/              # Validation pipes
│   │   └── zod.pipe.ts
│   ├── decorators/         # Custom decorators
│   │   └── roles.decorator.ts
│   ├── enums/              # Enumerations
│   │   └── roles.enum.ts
│   ├── modules/           # Global modules
│   │   └── jwt.module.ts  # JWT global module
│   ├── schemas/           # Shared schemas
│   │   └── image.schema.ts
│   ├── types/             # Type definitions
│   ├── constants/         # Constants
│   └── utils/            # Utility functions
│       ├── security/      # Security utilities
│       │   ├── hash.ts   # Password hashing
│       │   └── token.ts  # JWT service
│       ├── email/        # Email utilities
│       ├── image/        # Image processing
│       └── multer/       # File upload
│
├── config/                # Configuration
│   ├── configuration.ts  # Config factory
│   ├── config.schema.ts  # Zod validation schema
│   └── config.validator.ts
│
├── database/             # Database layer
│   └── repositories/
│       └── base.repository.ts
│
└── main.ts               # Application entry point
```

## Data Flow

### Request Flow

```
1. HTTP Request
   ↓
2. Middleware (CORS, Body Parser)
   ↓
3. Guards (Authentication, Authorization)
   ↓
4. Pipes (Validation - Zod)
   ↓
5. Controller (Route Handler)
   ↓
6. Service (Business Logic)
   ↓
7. Repository (Data Access)
   ↓
8. Database (MongoDB)
   ↓
9. Response (Interceptor)
   ↓
10. HTTP Response
```

### Authentication Flow

```
1. User submits credentials
   ↓
2. AuthService validates credentials
   ↓
3. JwtService generates token
   ↓
4. Token returned to client
   ↓
5. Client includes token in requests
   ↓
6. AuthGuard verifies token
   ↓
7. User attached to request
   ↓
8. Request proceeds
```

## Key Components

### 1. Configuration Management

Centralized configuration using `@nestjs/config`:
- Environment variables validated with Zod
- Type-safe configuration access
- Default values for optional settings

### 2. JWT Authentication

- **JwtGlobalModule**: Global module providing JWT service
- **JwtService**: Wrapper around `@nestjs/jwt` with ConfigService integration
- **AuthGuard**: Validates JWT tokens and attaches user to request
- **RolesGuard**: Enforces role-based access control

### 3. Validation

- **Zod Schemas**: Type-safe validation schemas
- **ZodPipe**: Custom pipe for Zod validation
- **Global ValidationPipe**: NestJS built-in validation

### 4. Error Handling

- **HttpExceptionFilter**: Global exception filter
- Standardized error responses
- Error logging

### 5. Response Formatting

- **SuccessHandlerInterceptor**: Standardizes success responses
- Consistent response structure across all endpoints

## Database Design

### Models

- **User**: User accounts with roles
- **Product**: Products with images, pricing, stock
- **Category**: Product categories
- **Brand**: Product brands
- **Cart**: Shopping cart items
- **Order**: Customer orders
- **Coupon**: Discount coupons
- **OTP**: One-time passwords for email verification

### Relationships

```
User 1:N Cart
User 1:N Order
User 1:N Favorites
Product N:1 Category
Product N:1 Brand
Order N:1 User
Order N:1 Coupon
OrderItem N:1 Product
CartItem N:1 Product
Order 1:1 PaymentIntent
```

## Payment System Architecture

### Overview

The payment system supports multiple payment methods with a centralized payment intent mechanism:

```
┌─────────────────────────────────────────────────────────┐
│                   Checkout Flow                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Create Checkout                                     │
│     ↓                                                   │
│  2. Validate Cart & Products                            │
│     ↓                                                   │
│  3. Create Order (PENDING)                              │
│     ↓                                                   │
│  4. Route by Payment Method                             │
│     ├─→ STRIPE: Create Checkout Session                │
│     └─→ COD: Immediate Order Confirmation              │
│     ↓                                                   │
│  5. Return Payment Intent                               │
│     ├─→ STRIPE: Redirect URL + Session ID              │
│     └─→ COD: Order confirmation                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Supported Payment Methods

#### 1. Stripe Payment
- **Type**: Third-party payment processor
- **Flow**: Hosted checkout with redirect
- **Implementation**: Uses Stripe Checkout Sessions API
- **Stock Deduction**: After webhook confirmation
- **User Data**: Card handled by Stripe (PCI compliant)
- **Webhook**: Listens to `payment_intent.succeeded` and `checkout.session.completed` events

#### 2. Cash on Delivery (COD)
- **Type**: Post-paid delivery
- **Flow**: Immediate order creation
- **Implementation**: No external integration required
- **Stock Deduction**: Immediate (order confirmed)
- **User Data**: No payment data needed
- **Status**: Payment pending until delivery confirmation

### Payment Intent Model

```typescript
interface PaymentIntent {
  intentId: string;              // Unique payment intent identifier
  orderId: ObjectId;              // Reference to order
  userId: ObjectId;               // Reference to user
  paymentMethod: 'STRIPE' | 'COD'; // Payment method
  amount: number;                 // Payment amount in cents
  currency: string;               // Currency code (USD, etc.)
  status: PaymentIntentStatus;    // PENDING | PROCESSING | SUCCEEDED | FAILED | CANCELLED
  stripeSessionId?: string;       // Stripe session ID (Stripe only)
  transactionReference?: string;  // External transaction reference
  metadata?: object;              // Additional payment metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment Flow by Method

#### Stripe Payment Flow
```
1. User initiates checkout
   ↓
2. CheckoutService.createCheckout()
   - Create Order (status: PENDING, paymentStatus: PENDING)
   - Create PaymentIntent (method: STRIPE)
   - Call StripePaymentService.createCheckoutSession()
   ↓
3. StripePaymentService
   - Create Stripe Checkout Session
   - Return session URL + ID
   ↓
4. Frontend redirects to Stripe
   ↓
5. User completes payment on Stripe
   ↓
6. Stripe sends webhook to /api/payment/webhook/stripe
   ↓
7. PaymentWebhookController
   - Verify webhook signature
   - Update PaymentIntent (status: SUCCEEDED)
   - Update Order (paymentStatus: PAID)
   - Deduct product stock
   - Increment coupon usage
   - Clear cart
   ↓
8. User redirected to success page
```

#### COD Payment Flow
```
1. User initiates checkout with paymentMethod: 'COD'
   ↓
2. CheckoutService.createCheckout()
   - Create Order (status: PENDING, paymentStatus: PENDING)
   - Create PaymentIntent (method: COD)
   - Deduct product stock immediately
   - Increment coupon usage
   - Clear cart
   ↓
3. Return order confirmation
   ↓
4. Order awaits delivery
   ↓
5. On delivery, admin marks payment as paid
   ↓
6. Order status updated
```

### Key Components

#### 1. CheckoutService
- Validates cart and products
- Creates orders and payment intents
- Routes to appropriate payment processor
- Handles stock deduction and cart clearing

#### 2. StripePaymentService
- Creates Stripe Checkout Sessions
- Confirms payment status
- Handles Stripe API communication

#### 3. CashOnDeliveryService
- Creates COD payment intents
- Marks payments as confirmed when received
- Handles COD-specific logic

#### 4. PaymentWebhookController
- Receives and verifies Stripe webhooks
- Updates order and payment status
- Triggers fulfillment workflow

#### 5. PaymentController
- Provides payment status queries
- Allows users to check payment details
- Confirms payment completion

### Stock Management

**Stock Deduction Strategy:**

| Payment Method | Timing | Reversible |
|---|---|---|
| **Stripe** | After payment confirmed | Yes (refund) |
| **COD** | Immediately on checkout | No (confirmed order) |

**Stock Holds:**
- Stripe: Stock held during checkout until webhook confirmation or 24-hour timeout
- COD: Stock immediately deducted (no hold)

### Error Handling

```typescript
// Payment-related errors
- PaymentIntentNotFound: Attempt to access non-existent payment intent
- UnauthorizedPaymentAccess: User attempting to access others' payment
- PaymentMethodInvalid: Unsupported payment method selected
- PaymentProcessingFailed: Payment processor returned error
- WebhookSignatureInvalid: Stripe webhook signature verification failed
```

## Security Features

1. **Password Hashing**: bcrypt with configurable salt rounds
2. **JWT Tokens**: Secure token-based authentication
3. **Input Validation**: Zod schema validation
4. **CORS Protection**: Configurable CORS settings
5. **File Upload Validation**: Type and size validation
6. **Role-Based Access Control**: Guards for protected routes
7. **Email Verification**: OTP-based verification

## Best Practices

### 1. Separation of Concerns
- Controllers handle HTTP concerns
- Services contain business logic
- Repositories handle data access

### 2. Type Safety
- TypeScript for type checking
- Zod for runtime validation
- Type-safe DTOs

### 3. Error Handling
- Global exception filter
- Consistent error responses
- Proper HTTP status codes

### 4. Code Organization
- Feature-based module structure
- Shared code in `common/`
- Clear naming conventions

### 5. Configuration
- Environment-based configuration
- Validation at startup
- Type-safe config access

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock dependencies
- Test business logic

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flow

### E2E Tests
- Test complete user flows
- Test error scenarios
- Test authorization

## Performance Considerations

1. **Database Indexing**: Indexes on frequently queried fields
2. **Pagination**: All list endpoints support pagination
3. **Lazy Loading**: Relationships loaded on demand
4. **Caching**: Can be added for frequently accessed data
5. **File Upload**: Streamed uploads for large files

## Scalability

The architecture supports horizontal scaling:
- Stateless API (JWT tokens)
- Database can be sharded
- File storage can be externalized (S3, etc.)
- Can be containerized (Docker)

## Future Enhancements

1. **Caching Layer**: Redis for session/cache
2. **Message Queue**: For async operations
3. **Search**: Elasticsearch for product search
4. **Real-time**: WebSocket for notifications
5. **Microservices**: Split into smaller services if needed

