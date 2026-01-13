# 🛒 E-Commerce API

A modern, scalable e-commerce backend API built with **NestJS**, **TypeScript**, and **MongoDB**. This project provides a complete solution for managing products, orders, users, carts, and more.

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Authentication](#-authentication)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [Testing](#-testing)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access control (Customer, Seller, Admin)
- 📧 **Email Verification** - OTP-based email verification system
- 🛍️ **Product Management** - Full CRUD operations for products with image uploads
- 🏷️ **Categories & Brands** - Organize products with categories and brands
- 🛒 **Shopping Cart** - Add, update, and manage cart items
- 💰 **Coupon System** - Apply discount coupons to orders
- 📦 **Order Management** - Complete order lifecycle management
- ⭐ **Favorites** - Save favorite products
- 👥 **User Management** - User profiles and role management
- 📸 **Image Upload** - Secure file upload with validation
- ✅ **Input Validation** - Zod schema validation for all endpoints
- 🛡️ **Security** - Password hashing, JWT tokens, CORS protection
- 📝 **Error Handling** - Global exception filters and standardized responses

## 🚀 Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: bcrypt for password hashing

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd E-commerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration (see [Environment Variables](#environment-variables) or [detailed guide](docs/ENVIRONMENT.md))

4. **Start the development server**
   ```bash
   npm run start:dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run start:prod
   ```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DB_HOST=mongodb://localhost:27017/ecommerce

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m

# CORS Configuration (optional)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ecommerce.com

# File Upload Configuration (optional)
MAX_FILE_SIZE=5242880

# Frontend URL (optional)
FRONTEND_URL=http://localhost:3000
```

### Required Variables
- `NODE_ENV` - Environment (development, production, test)
- `DB_HOST` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (minimum 32 characters)

### Optional Variables
- `PORT` - Server port (default: 3000)
- `JWT_EXPIRES_IN` - Token expiration time (default: 15m)
- `CORS_ORIGIN` - Allowed CORS origins
- Email configuration for sending verification emails
- `MAX_FILE_SIZE` - Maximum file upload size in bytes (default: 5MB)

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference with all endpoints
- **[Architecture Documentation](docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[Setup Guide](docs/SETUP.md)** - Detailed setup and installation instructions
- **[Environment Variables](docs/ENVIRONMENT.md)** - Complete environment variables reference

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "age": 25
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Verify Email
```http
POST /api/auth/confirm-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/product?page=1&limit=10&category=electronics&brand=nike&minPrice=100&maxPrice=1000&search=laptop
```

#### Get Product by ID
```http
GET /api/product/:id
```

#### Create Product (Admin/Seller)
```http
POST /api/product
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 50,
  "categoryId": "category_id",
  "brandId": "brand_id",
  "images": [files]
}
```

#### Update Product (Admin/Seller)
```http
PATCH /api/product/:id
Authorization: Bearer <token>
```

#### Delete Product (Admin/Seller)
```http
DELETE /api/product/:id
Authorization: Bearer <token>
```

### Category Endpoints

#### Get All Categories
```http
GET /api/category
```

#### Get Category by ID
```http
GET /api/category/:id
```

#### Create Category (Admin)
```http
POST /api/category
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Update Category (Admin)
```http
PATCH /api/category/:id
Authorization: Bearer <token>
```

#### Delete Category (Admin)
```http
DELETE /api/category/:id
Authorization: Bearer <token>
```

### Brand Endpoints

#### Get All Brands
```http
GET /api/brand
```

#### Get Brand by ID
```http
GET /api/brand/:id
```

#### Create Brand (Admin)
```http
POST /api/brand
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Update Brand (Admin)
```http
PATCH /api/brand/:id
Authorization: Bearer <token>
```

#### Delete Brand (Admin)
```http
DELETE /api/brand/:id
Authorization: Bearer <token>
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

#### Add to Cart
```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 2
}
```

#### Update Cart Item
```http
PATCH /api/cart/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove from Cart
```http
DELETE /api/cart/:itemId
Authorization: Bearer <token>
```

#### Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <token>
```

### Order Endpoints

#### Create Order
```http
POST /api/order
Authorization: Bearer <token>
Content-Type: application/json

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
  "couponCode": "DISCOUNT10" // optional
}
```

#### Get User Orders
```http
GET /api/order
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/order/:id
Authorization: Bearer <token>
```

#### Update Order Status (Admin)
```http
PATCH /api/order/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

### Coupon Endpoints

#### Get All Coupons (Admin)
```http
GET /api/coupon
Authorization: Bearer <token>
```

#### Create Coupon (Admin)
```http
POST /api/coupon
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER20",
  "discount": 20,
  "type": "PERCENTAGE",
  "minPurchase": 100,
  "maxDiscount": 50,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Apply Coupon
```http
POST /api/coupon/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER20"
}
```

### User Endpoints

#### Get Profile
```http
GET /api/user/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PATCH /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "age": 26
}
```

#### Get All Users (Admin)
```http
GET /api/user/all?page=1&limit=10
Authorization: Bearer <token>
```

#### Update User Role (Admin)
```http
PATCH /api/user/:userId/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

### Favorites Endpoints

#### Get Favorites
```http
GET /api/favorites
Authorization: Bearer <token>
```

#### Add to Favorites
```http
POST /api/favorites/:productId
Authorization: Bearer <token>
```

#### Remove from Favorites
```http
DELETE /api/favorites/:productId
Authorization: Bearer <token>
```

## 🔑 Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **CUSTOMER** - Default role, can browse products, manage cart, place orders
- **SELLER** - Can create and manage products
- **ADMIN** - Full access to all resources

## 📁 Project Structure

```
src/
├── auth/              # Authentication module
│   ├── dto/          # Data transfer objects
│   ├── validation/   # Zod validation schemas
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── user/             # User management
├── product/          # Product management
├── category/         # Category management
├── brand/            # Brand management
├── cart/             # Shopping cart
├── order/            # Order management
├── coupon/           # Coupon system
├── favorites/        # Favorites/wishlist
├── otp/              # OTP service
├── common/           # Shared utilities
│   ├── guards/       # Auth & role guards
│   ├── interceptors/ # Response interceptors
│   ├── filters/      # Exception filters
│   ├── pipes/        # Validation pipes
│   ├── modules/      # Global modules (JWT)
│   └── utils/        # Utility functions
├── config/           # Configuration
├── database/         # Database repositories
└── main.ts           # Application entry point
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Zod schema validation on all endpoints
- **CORS Protection**: Configurable CORS settings
- **File Upload Validation**: Type and size validation
- **Role-Based Access Control**: Guards for protected routes
- **Email Verification**: OTP-based verification system

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 👨‍💻 Author

Mohammed Enisar

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- MongoDB for the database solution
- All contributors and open-source libraries used

---

**Note**: This is a backend API. You'll need a frontend application to interact with it. Make sure to configure CORS properly for your frontend domain.

