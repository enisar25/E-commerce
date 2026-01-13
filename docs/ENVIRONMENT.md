# Environment Variables

Complete reference for all environment variables used in the application.

## Required Variables

These variables must be set for the application to run:

### `NODE_ENV`
- **Type**: `string`
- **Values**: `development` | `production` | `test`
- **Default**: `development`
- **Description**: Application environment mode
- **Example**: `NODE_ENV=production`

### `DB_HOST`
- **Type**: `string`
- **Required**: Yes
- **Description**: MongoDB connection string
- **Example (Local)**: `mongodb://localhost:27017/ecommerce`
- **Example (Atlas)**: `mongodb+srv://username:password@cluster.mongodb.net/ecommerce`
- **Validation**: Must not be empty

### `JWT_SECRET`
- **Type**: `string`
- **Required**: Yes
- **Min Length**: 32 characters
- **Description**: Secret key for signing JWT tokens
- **Security**: Must be a strong, random string in production
- **Example**: `your-super-secret-jwt-key-minimum-32-characters-long`
- **Generation**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Optional Variables

### Server Configuration

#### `PORT`
- **Type**: `number`
- **Default**: `3000`
- **Description**: Port number for the HTTP server
- **Example**: `PORT=3000`

### JWT Configuration

#### `JWT_EXPIRES_IN`
- **Type**: `string`
- **Default**: `15m`
- **Description**: JWT token expiration time
- **Format**: Time string (e.g., `15m`, `1h`, `7d`)
- **Examples**:
  - `15m` - 15 minutes
  - `1h` - 1 hour
  - `7d` - 7 days
  - `30d` - 30 days

### CORS Configuration

#### `CORS_ORIGIN`
- **Type**: `string` or `string[]`
- **Default**: `*` (all origins)
- **Description**: Allowed CORS origins (comma-separated for multiple)
- **Example (Single)**: `CORS_ORIGIN=http://localhost:3000`
- **Example (Multiple)**: `CORS_ORIGIN=http://localhost:3000,https://example.com`
- **Production**: Should be set to your frontend domain(s)

### Email Configuration

These are optional but required for email verification to work:

#### `EMAIL_HOST`
- **Type**: `string`
- **Description**: SMTP server hostname
- **Example**: `EMAIL_HOST=smtp.gmail.com`
- **Common Providers**:
  - Gmail: `smtp.gmail.com`
  - Outlook: `smtp-mail.outlook.com`
  - Yahoo: `smtp.mail.yahoo.com`

#### `EMAIL_PORT`
- **Type**: `number`
- **Default**: `587`
- **Description**: SMTP server port
- **Common Ports**:
  - `587` - TLS/STARTTLS (recommended)
  - `465` - SSL
  - `25` - Unencrypted (not recommended)

#### `EMAIL_SECURE`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Use SSL/TLS for email connection
- **Values**: `true` | `false`
- **Note**: Set to `true` for port 465, `false` for port 587

#### `EMAIL_USER`
- **Type**: `string`
- **Description**: SMTP username (usually your email address)
- **Example**: `EMAIL_USER=your-email@gmail.com`

#### `EMAIL_PASSWORD`
- **Type**: `string`
- **Description**: SMTP password
- **Gmail**: Use App Password (not regular password)
- **Example**: `EMAIL_PASSWORD=your-app-password`

#### `EMAIL_FROM`
- **Type**: `string` (email format)
- **Default**: `noreply@ecommerce.com`
- **Description**: Default "from" email address
- **Example**: `EMAIL_FROM=noreply@yourdomain.com`
- **Validation**: Must be a valid email format

### File Upload Configuration

#### `MAX_FILE_SIZE`
- **Type**: `number` (bytes)
- **Default**: `5242880` (5MB)
- **Description**: Maximum file upload size in bytes
- **Examples**:
  - `5242880` - 5MB
  - `10485760` - 10MB
  - `20971520` - 20MB

### Frontend Configuration

#### `FRONTEND_URL`
- **Type**: `string` (URL format)
- **Default**: `http://localhost:3000`
- **Description**: Frontend application URL (for CORS, redirects, etc.)
- **Example**: `FRONTEND_URL=https://yourdomain.com`
- **Validation**: Must be a valid URL

### Stripe Configuration (Optional - if using Stripe)

#### `STRIPE_SECRET_KEY`
- **Type**: `string`
- **Description**: Stripe secret key
- **Example**: `STRIPE_SECRET_KEY=sk_test_...`

#### `STRIPE_WEBHOOK_SECRET`
- **Type**: `string`
- **Description**: Stripe webhook signing secret
- **Example**: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Environment File Example

Complete `.env` file example:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ecommerce.com

# File Upload
MAX_FILE_SIZE=5242880

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Production Environment

For production, ensure:

1. **Strong JWT Secret**: Use a cryptographically secure random string (minimum 32 characters)
2. **Secure Database**: Use MongoDB Atlas or secured MongoDB instance
3. **Proper CORS**: Set `CORS_ORIGIN` to your frontend domain(s) only
4. **Email Configuration**: Use production email service
5. **Environment Mode**: Set `NODE_ENV=production`
6. **Secure Ports**: Use standard ports (80, 443) with reverse proxy (nginx)

## Validation

All environment variables are validated at application startup using Zod schemas. If validation fails, the application will not start and will display specific error messages.

### Validation Rules

- `NODE_ENV`: Must be one of `development`, `production`, `test`
- `DB_HOST`: Required, minimum 1 character
- `JWT_SECRET`: Required, minimum 32 characters
- `JWT_EXPIRES_IN`: Optional, defaults to `15m`
- `EMAIL_FROM`: If provided, must be valid email format
- `FRONTEND_URL`: If provided, must be valid URL format
- `EMAIL_PORT`: If provided, must be valid number
- `MAX_FILE_SIZE`: If provided, must be valid number

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different secrets** for development and production
3. **Rotate secrets** periodically
4. **Use environment-specific values** for all environments
5. **Restrict database access** with proper authentication
6. **Use strong passwords** for database and email
7. **Enable SSL/TLS** for database connections in production
8. **Use App Passwords** for Gmail (not regular passwords)

## Troubleshooting

### Variable Not Found
- Check `.env` file exists in root directory
- Verify variable name spelling (case-sensitive)
- Restart application after changing `.env`

### Validation Errors
- Check error message for specific validation rule
- Ensure required variables are set
- Verify format matches expected type

### Default Values Not Working
- Some variables have defaults in code
- Check `src/config/configuration.ts` for defaults
- Ensure `.env` file is being loaded

