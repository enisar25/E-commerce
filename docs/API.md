# API Documentation

Complete API reference for the E-Commerce backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "age": 25
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "Signup successful, verification OTP sent",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "isVerified": false
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "jwt_token_here"
  }
}
```

#### POST `/api/auth/confirm-email`
Verify email with OTP.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### POST `/api/auth/resend-otp`
Resend verification OTP.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### GET `/api/auth/me`
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

---

### Products (`/api/product`)

#### GET `/api/product`
Get all products with optional filters.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)
- `category` (string) - Filter by category ID
- `brand` (string) - Filter by brand ID
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `search` (string) - Search in name/description
- `sortBy` (string) - Sort field (price, createdAt, etc.)
- `sortOrder` (string) - Sort order (asc, desc)

**Example:**
```
GET /api/product?page=1&limit=10&category=cat123&minPrice=100&maxPrice=1000
```

#### GET `/api/product/:id`
Get product by ID.

#### POST `/api/product`
Create a new product (Admin/Seller only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string, required)
- `description` (string, required)
- `price` (number, required)
- `stock` (number, required)
- `categoryId` (string, required)
- `brandId` (string, required)
- `images` (file[], optional)

#### PATCH `/api/product/:id`
Update product (Admin/Seller only).

#### DELETE `/api/product/:id`
Delete product (Admin/Seller only).

---

### Categories (`/api/category`)

#### GET `/api/category`
Get all categories.

#### GET `/api/category/:id`
Get category by ID.

#### POST `/api/category`
Create category (Admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string, required)
- `description` (string, optional)
- `image` (file, optional)

#### PATCH `/api/category/:id`
Update category (Admin only).

#### DELETE `/api/category/:id`
Delete category (Admin only).

---

### Brands (`/api/brand`)

#### GET `/api/brand`
Get all brands.

#### GET `/api/brand/:id`
Get brand by ID.

#### POST `/api/brand`
Create brand (Admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string, required)
- `description` (string, optional)
- `website` (string, optional, URL)
- `image` (file, optional)

#### PATCH `/api/brand/:id`
Update brand (Admin only).

#### DELETE `/api/brand/:id`
Delete brand (Admin only).

---

### Cart (`/api/cart`)

#### GET `/api/cart`
Get user's cart.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/api/cart`
Add item to cart.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2
}
```

#### PATCH `/api/cart/:itemId`
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

#### DELETE `/api/cart/:itemId`
Remove item from cart.

#### DELETE `/api/cart`
Clear entire cart.

---

### Orders (`/api/order`)

#### POST `/api/order`
Create a new order.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "couponCode": "DISCOUNT10"
}
```

#### GET `/api/order`
Get user's orders.

#### GET `/api/order/:id`
Get order by ID.

#### PATCH `/api/order/:id/status`
Update order status (Admin only).

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

**Order Statuses:**
- `PENDING` - Order placed, awaiting confirmation
- `CONFIRMED` - Order confirmed
- `PROCESSING` - Order being processed
- `SHIPPED` - Order shipped
- `DELIVERED` - Order delivered
- `CANCELLED` - Order cancelled

---

### Coupons (`/api/coupon`)

#### GET `/api/coupon`
Get all coupons (Admin only).

#### POST `/api/coupon`
Create coupon (Admin only).

**Request Body:**
```json
{
  "code": "SUMMER20",
  "discount": 20,
  "type": "PERCENTAGE",
  "minPurchase": 100,
  "maxDiscount": 50,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Coupon Types:**
- `PERCENTAGE` - Percentage discount
- `FIXED` - Fixed amount discount

#### POST `/api/coupon/apply`
Apply coupon to get discount details.

**Request Body:**
```json
{
  "code": "SUMMER20",
  "totalAmount": 150
}
```

#### DELETE `/api/coupon/:id`
Delete coupon (Admin only).

---

### Users (`/api/user`)

#### GET `/api/user/profile`
Get current user profile.

#### PATCH `/api/user/profile`
Update user profile.

**Request Body:**
```json
{
  "name": "John Updated",
  "age": 26
}
```

#### GET `/api/user/all`
Get all users with pagination (Admin only).

**Query Parameters:**
- `page` (number)
- `limit` (number)

#### PATCH `/api/user/:userId/role`
Update user role (Admin only).

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Roles:**
- `CUSTOMER` - Default role
- `SELLER` - Can create products
- `ADMIN` - Full access

---

### Favorites (`/api/favorites`)

#### GET `/api/favorites`
Get user's favorite products.

#### POST `/api/favorites/:productId`
Add product to favorites.

#### DELETE `/api/favorites/:productId`
Remove product from favorites.

---

### Checkout (`/api/checkout`)

#### POST `/api/checkout`
Create a checkout and initiate payment process.

**Authentication:** Required

**Request Body:**
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  },
  "shippingCost": 10.00,
  "notes": "Please deliver before 5 PM",
  "paymentMethod": "STRIPE",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

**Parameters:**
- `shippingAddress` (required) - Shipping address object
  - `street` (string, required) - Street address
  - `city` (string, required) - City
  - `state` (string, required) - State/Province
  - `zipCode` (string, required) - ZIP/Postal code
  - `country` (string, required) - Country
  - `phone` (string, optional) - Phone number
- `shippingCost` (number, optional) - Shipping cost in dollars (default: 0)
- `notes` (string, optional) - Order notes (max 500 characters)
- `paymentMethod` (string, required) - Payment method: `STRIPE` or `COD`
- `successUrl` (string, optional) - Redirect URL after successful Stripe payment
- `cancelUrl` (string, optional) - Redirect URL if user cancels Stripe payment

**Response (Stripe):**
```json
{
  "statusCode": 201,
  "message": "Checkout created successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD-20240101-001",
      "userId": "user_id",
      "items": [ ... ],
      "total": 150.00,
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "paymentMethod": "STRIPE"
    },
    "paymentIntent": {
      "paymentIntentId": "pi_...",
      "sessionId": "cs_...",
      "url": "https://checkout.stripe.com/..."
    }
  }
}
```

**Response (COD):**
```json
{
  "statusCode": 201,
  "message": "Checkout created successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "ORD-20240101-001",
      "userId": "user_id",
      "items": [ ... ],
      "total": 150.00,
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "paymentMethod": "COD"
    },
    "paymentIntent": {
      "paymentIntentId": "intent_id"
    }
  }
}
```

**Errors:**
- `404` - Cart not found
- `400` - Cart is empty
- `400` - Product not available or out of stock
- `400` - Invalid payment method

---

### Payment (`/api/payment`)

#### GET `/api/payment/intent/:id`
Get payment intent details.

**Authentication:** Required

**Response:**
```json
{
  "statusCode": 200,
  "message": "Payment intent fetched successfully",
  "data": {
    "_id": "intent_id",
    "intentId": "pi_...",
    "orderId": "order_id",
    "userId": "user_id",
    "paymentMethod": "STRIPE",
    "amount": 15000,
    "currency": "USD",
    "status": "PENDING",
    "stripeSessionId": "cs_...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Payment intent not found
- `403` - Unauthorized access to payment intent

#### GET `/api/payment/intent/:id/confirm`
Confirm payment for Stripe transactions.

**Authentication:** Required

**Response:**
```json
{
  "statusCode": 200,
  "message": "Payment confirmed",
  "data": {
    "status": "SUCCEEDED",
    "paymentIntentId": "pi_..."
  }
}
```

**Errors:**
- `404` - Payment intent not found
- `403` - Unauthorized access
- `400` - Only STRIPE payments can be confirmed by users

---

### Payment Webhook (`/api/payment/webhook`)

#### POST `/api/payment/webhook/stripe`
Stripe webhook endpoint for payment events.

**Note:** This endpoint is called by Stripe, not by your frontend.

**Stripe Signature Header:** Required
```
Stripe-Signature: <signature>
```

**Webhook Events Handled:**
- `payment_intent.succeeded` - Payment completed successfully
- `checkout.session.completed` - Checkout session completed
- `payment_intent.payment_failed` - Payment failed

**Actions on Success:**
- Update PaymentIntent status to `SUCCEEDED`
- Update Order paymentStatus to `PAID`
- Deduct product stock
- Increment coupon usage (if applied)
- Clear user's cart

---

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Pagination

Paginated endpoints return data in this format:

```json
{
  "statusCode": 200,
  "message": "Data fetched successfully",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## File Uploads

For endpoints that accept file uploads:
- Use `multipart/form-data` content type
- Maximum file size: 5MB (configurable)
- Allowed image types: JPEG, JPG, PNG, WEBP, GIF
- Files are stored in `uploads/` directory

