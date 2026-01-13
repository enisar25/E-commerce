# Setup Guide

Complete guide to set up and run the E-Commerce API.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Comes with Node.js

### Verify Installation

```bash
node --version  # Should be v18 or higher
npm --version   # Should be v8 or higher
mongod --version  # Should be v6 or higher
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd E-commerce
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### 3. Set Up MongoDB

#### Option A: Local MongoDB

1. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (if installed via Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is running:
   ```bash
   mongosh
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Use connection string in `.env` file

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DB_HOST=mongodb://localhost:27017/ecommerce
# For MongoDB Atlas:
# DB_HOST=mongodb+srv://username:password@cluster.mongodb.net/ecommerce

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this-in-production
JWT_EXPIRES_IN=15m

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Email Configuration (Optional - for email verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ecommerce.com

# File Upload Configuration
MAX_FILE_SIZE=5242880

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 5. Generate JWT Secret

Generate a secure JWT secret (minimum 32 characters):

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use an online generator
# https://randomkeygen.com/
```

### 6. Set Up Email (Optional)

If you want email verification to work:

#### Gmail Setup:
1. Enable 2-Step Verification
2. Generate App Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password
   - Use this password in `EMAIL_PASSWORD`

#### Other Email Providers:
Update `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_SECURE` accordingly.

### 7. Create Upload Directories

The application will create these automatically, but you can create them manually:

```bash
mkdir -p uploads/products
mkdir -p uploads/categories
mkdir -p uploads/brands
```

### 8. Run the Application

#### Development Mode
```bash
npm run start:dev
```

This will:
- Start the server on `http://localhost:3000`
- Watch for file changes and auto-reload
- Show detailed error messages

#### Production Mode
```bash
npm run build
npm run start:prod
```

### 9. Verify Installation

1. Check if server is running:
   ```bash
   curl http://localhost:3000/api
   ```

2. You should see a response from the API.

## Common Issues

### MongoDB Connection Error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution**:
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
- Change `PORT` in `.env` to another port (e.g., 3001)
- Or kill the process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:3000 | xargs kill
  ```

### JWT Secret Too Short

**Error**: `JWT secret must be at least 32 characters`

**Solution**:
- Generate a longer secret (minimum 32 characters)
- Update `JWT_SECRET` in `.env`

### Email Not Sending

**Error**: Email verification not working

**Solution**:
- Check email credentials in `.env`
- For Gmail, use App Password (not regular password)
- Verify SMTP settings for your email provider
- Check firewall/network settings

### File Upload Fails

**Error**: File upload not working

**Solution**:
- Check `MAX_FILE_SIZE` in `.env`
- Ensure upload directories exist
- Check file type (only images allowed)
- Verify file size (default max: 5MB)

## Development Tools

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- MongoDB for VS Code

### Useful Commands

```bash
# Format code
npm run format

# Lint code
npm run lint

# Build project
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:cov
```

## Database Setup

### Initial Data (Optional)

You can create initial data using MongoDB shell or a script:

```javascript
// Connect to MongoDB
mongosh ecommerce

// Create admin user (example)
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2b$10$hashed_password_here", // Use bcrypt to hash
  role: "ADMIN",
  isVerified: true,
  age: 30
})
```

**Note**: Use the application's signup endpoint to create users properly (password will be hashed automatically).

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:
- Use strong `JWT_SECRET`
- Set `NODE_ENV=production`
- Configure production database
- Set proper `CORS_ORIGIN`
- Configure email service

### Build for Production

```bash
npm run build
npm run start:prod
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name ecommerce-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

Build and run:
```bash
docker build -t ecommerce-api .
docker run -p 3000:3000 --env-file .env ecommerce-api
```

## Next Steps

1. **Test the API**: Use Postman or curl to test endpoints
2. **Create Admin User**: Sign up and update role to ADMIN
3. **Add Products**: Create categories, brands, and products
4. **Configure Frontend**: Connect your frontend application

## Getting Help

- Check the [API Documentation](./API.md)
- Review [Architecture Documentation](./ARCHITECTURE.md)
- Check error logs in console
- Verify environment variables
- Ensure MongoDB is running

