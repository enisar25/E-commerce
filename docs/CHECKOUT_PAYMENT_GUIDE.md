# Checkout & Payment System Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Payment Methods](#payment-methods)
4. [API Endpoints](#api-endpoints)
5. [Payment Flow](#payment-flow)
6. [Configuration](#configuration)
7. [Usage Examples](#usage-examples)
8. [Webhook Setup](#webhook-setup)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The checkout and payment system provides a complete solution for processing orders with multiple payment methods. It supports:
- **Stripe** - Online payment processing via Stripe
- **Cash on Delivery (COD)** - Payment upon delivery

### Key Components

- **Payment Module** (`src/payment/`) - Handles all payment-related operations
- **Checkout Service** (`src/order/checkout/`) - Manages checkout process and order creation
- **Payment Intents** - Track payment state throughout the transaction lifecycle

---

## Architecture

### System Flow

```
User Cart → Checkout → Payment Intent Creation → Payment Processing → Order Completion
```

### Component Structure

```
┌─────────────────┐
│  Checkout API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Checkout Service│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Order  │ │ Payment      │
│ Service│ │ Services     │
└────────┘ └──────┬───────┘
                  │
         ┌────────┴────────┐
         │                  │
    ┌────▼────┐      ┌──────▼──────┐
    │ Stripe  │      │ Cash on      │
    │ Service │      │ Delivery Svc │
    └─────────┘      └──────────────┘
```

### Database Models

#### PaymentIntent
- Tracks payment state and metadata
- Links to Order and User
- Stores payment method-specific data (Stripe IDs, transaction references, etc.)

#### Order (Updated)
- Now includes payment fields:
  - `paymentMethod`: Payment method used
  - `paymentStatus`: Current payment status
  - `paymentIntentId`: Reference to payment intent
  - Stripe-specific fields for tracking

---

## Payment Methods

### 1. Stripe Payment

**Best for:** Online credit/debit card payments

**Features:**
- Secure payment processing via Stripe
- Supports checkout sessions (redirect flow)
- Supports payment intents (embedded flow)
- Automatic webhook handling
- PCI compliance handled by Stripe

**Flow:**
1. Create checkout session
2. User redirected to Stripe
3. User completes payment
4. Webhook updates order status


### 3. Cash on Delivery (COD)

**Best for:** Physical delivery with payment on receipt

**Features:**
- Automatic order creation
- Payment status remains PENDING until delivery
- Stock deducted immediately (order is confirmed)
- Admin can mark as paid when payment collected

**Flow:**
1. Create order with COD payment method
2. Order created immediately (stock deducted)
3. Payment collected on delivery
4. Admin updates payment status

---

## API Endpoints

### Checkout Endpoints

#### Create Checkout
```http
POST /api/checkout
Authorization: Bearer <token>
Content-Type: application/json

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
  "paymentMethod": "STRIPE",  // or "COD"
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "Checkout created successfully",
  "data": {
    "order": {
      "orderNumber": "ORD-20240101-001",
      "total": 150.00,
      "status": "PENDING",
      "paymentStatus": "PENDING",
      ...
    },
    "paymentIntent": {
      "paymentIntentId": "...",
      "sessionId": "cs_...",  // For Stripe
      "url": "https://checkout.stripe.com/..."  // For Stripe redirect
    }
  }
}
```

### Payment Endpoints

#### Get Payment Intent
```http
GET /api/payment/intent/:id
Authorization: Bearer <token>
```

#### Confirm Payment
```http
GET /api/payment/intent/:id/confirm
Authorization: Bearer <token>
```

### Webhook Endpoint

#### Stripe Webhook
```http
POST /api/payment/webhook/stripe
Stripe-Signature: <signature>
Content-Type: application/json
```

**Note:** This endpoint is called by Stripe, not by your frontend.

---

## Payment Flow

### Stripe Payment Flow

```
1. User clicks "Checkout"
   ↓
2. Frontend calls POST /api/checkout with paymentMethod: "STRIPE"
   ↓
3. Backend creates:
   - Order (status: PENDING, paymentStatus: PENDING)
   - Payment Intent (status: PENDING)
   - Stripe Checkout Session
   ↓
4. Backend returns checkout session URL
   ↓
5. Frontend redirects user to Stripe checkout
   ↓
6. User completes payment on Stripe
   ↓
7. Stripe sends webhook to /api/payment/webhook/stripe
   ↓
8. Backend updates:
   - Payment Intent (status: SUCCEEDED)
   - Order (paymentStatus: PAID)
   - Deducts stock
   - Clears cart
   ↓
9. User redirected to successUrl
```

### COD Payment Flow

```
1. User clicks "Checkout"
   ↓
2. Frontend calls POST /api/checkout with paymentMethod: "COD"
   ↓
3. Backend creates:
   - Order (status: PENDING, paymentStatus: PENDING)
   - Payment Intent (status: PENDING)
   - Immediately deducts stock (order is confirmed)
   - Clears cart
   ↓
4. Backend returns order confirmation
   ↓
5. Order is processed and shipped
   ↓
6. On delivery, admin marks payment as collected
   (via order update endpoint)
```

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

### Stripe Setup

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Get your API keys from the dashboard

2. **Configure Webhooks**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourapi.com/api/payment/webhook/stripe`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
   - Copy the webhook signing secret

3. **Update Configuration**
   ```env
   STRIPE_SECRET_KEY=sk_live_...  # or sk_test_... for testing
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Usage Examples

### Example 1: Stripe Checkout

```typescript
// Frontend code
async function checkoutWithStripe() {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      shippingCost: 10.00,
      paymentMethod: 'STRIPE',
      successUrl: 'https://yourapp.com/success',
      cancelUrl: 'https://yourapp.com/cancel',
    }),
  });

  const data = await response.json();
  
  // Redirect to Stripe checkout
  if (data.data.paymentIntent.url) {
    window.location.href = data.data.paymentIntent.url;
  }
}
```

### Example 2: Cash on Delivery

```typescript
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shippingAddress: { /* ... */ },
    paymentMethod: 'COD',
  }),
});

// Order is immediately created and confirmed
// Payment will be collected on delivery
```

---

## Webhook Setup

### Stripe Webhook Configuration

1. **Local Development (using Stripe CLI)**

   ```bash
   # Install Stripe CLI
   # https://stripe.com/docs/stripe-cli

   # Login to Stripe
   stripe login

   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/payment/webhook/stripe
   ```

2. **Production Setup**

   - Add webhook endpoint in Stripe Dashboard
   - URL: `https://yourdomain.com/api/payment/webhook/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`

3. **Webhook Security**

   The webhook controller verifies the Stripe signature to ensure requests are from Stripe:

   ```typescript
   // Automatically handled by PaymentWebhookController
   // Uses STRIPE_WEBHOOK_SECRET from environment
   ```

### Testing Webhooks

```bash
# Using Stripe CLI
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

---

## Troubleshooting

### Common Issues

#### 1. Stripe Webhook Not Working

**Problem:** Webhooks not being received or verified

**Solutions:**
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint URL in Stripe Dashboard
- Ensure `rawBody: true` is set in `main.ts` (already configured)
- Check webhook signature in Stripe Dashboard logs

#### 2. Payment Intent Not Found

**Problem:** `Payment intent not found` error

**Solutions:**
- Verify payment intent ID is correct
- Check if payment intent belongs to the user
- Ensure payment intent wasn't deleted

#### 3. Stock Not Deducted

**Problem:** Stock remains unchanged after payment

**Solutions:**
- For Stripe: Check webhook is firing and updating order
- For COD: Stock should be deducted immediately

#### 4. Circular Dependency Error

**Problem:** `Nest can't resolve dependencies` error

**Solutions:**
- Already handled with `forwardRef()` in modules
- If issues persist, check module imports

#### 5. Stripe Checkout Session Not Redirecting

**Problem:** No redirect URL returned

**Solutions:**
- Check Stripe API key is valid
- Verify `FRONTEND_URL` is set in environment
- Check Stripe account is active

### Debug Tips

1. **Check Payment Intent Status**
   ```http
   GET /api/payment/intent/:id
   ```

2. **Verify Order Payment Status**
   ```http
   GET /api/order/:id
   ```

3. **Check Webhook Logs**
   - Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Logs
   - Application logs for webhook processing

4. **Test Payment Flow**
   - Use Stripe test cards: https://stripe.com/docs/testing
   - Test card: `4242 4242 4242 4242`
   - Any future expiry date and any 3-digit CVC

---

## Best Practices

### Security

1. **Never store full card numbers** - Use payment tokens
2. **Verify webhook signatures** - Always validate Stripe webhooks
3. **Use HTTPS** - Required for production
4. **Validate payment amounts** - Verify amounts match on webhook

### Error Handling

1. **Handle payment failures gracefully**
2. **Provide clear error messages to users**
3. **Log payment errors for debugging**
4. **Implement retry logic for webhooks**

### User Experience

1. **Show loading states** during payment processing
2. **Provide clear success/failure messages**
3. **Handle payment cancellations**
4. **Send confirmation emails** after successful payment

### Testing

1. **Use Stripe test mode** for development
2. **Test all payment methods** before production
3. **Test webhook handling** with Stripe CLI
4. **Test error scenarios** (failed payments, cancellations)

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [NestJS Documentation](https://docs.nestjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)

---

## Support

For issues or questions:
1. Check this guide first
2. Review error logs
3. Check Stripe Dashboard for payment status
4. Verify environment configuration

---

**Last Updated:** 2024-01-01

