# StockFlow API Guide

This document describes the public API routes for the StockFlow SaaS inventory management application.

## Overview

StockFlow exposes REST-style endpoints using Next.js App Router API routes.

- Authentication is handled with JWTs stored in an HTTP-only cookie named `stockflow-token`.
- All protected routes require a valid session cookie.
- Requests and responses are JSON.
- Data is scoped by `organizationId` in the session, so every user can only access their own organization's data.

## Authentication

### POST /api/auth/signup

Create a new organization and user account.

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "organizationName": "Acme Inventory"
}
```

Response (201 Created):

```json
{
  "user": {
    "id": "user-cuid",
    "email": "user@example.com",
    "organizationId": "org-cuid",
    "organizationName": "Acme Inventory"
  }
}
```

Common errors:
- `400` validation failed
- `409` email already exists
- `500` internal server error

### POST /api/auth/login

Authenticate an existing user and set the session cookie.

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200 OK):

```json
{
  "user": {
    "id": "user-cuid",
    "email": "user@example.com",
    "organizationId": "org-cuid",
    "organizationName": "Acme Inventory"
  }
}
```

Common errors:
- `400` validation failed
- `401` invalid email or password
- `500` internal server error

### POST /api/auth/logout

Clear the session cookie and sign the user out.

Response (200 OK):

```json
{
  "success": true
}
```

## Products

All `/api/products` endpoints require an authenticated session.

### GET /api/products

Fetch all products for the current organization.

Query parameters:
- `search` optional string to filter by product name or SKU

Response (200 OK):

```json
{
  "products": [
    {
      "id": "product-cuid",
      "organizationId": "org-cuid",
      "name": "Blue Widget",
      "sku": "BW-001",
      "description": "A useful widget.",
      "quantityOnHand": 20,
      "costPrice": 5.25,
      "sellingPrice": 12.5,
      "lowStockThreshold": 10,
      "lastUpdatedBy": "user@example.com",
      "createdAt": "2026-07-01T00:00:00.000Z",
      "updatedAt": "2026-07-01T00:00:00.000Z",
      "effectiveLowStockThreshold": 10,
      "isLowStock": false
    }
  ]
}
```

### POST /api/products

Create a new product.

Request body:

```json
{
  "name": "Blue Widget",
  "sku": "BW-001",
  "description": "A useful widget.",
  "quantityOnHand": 20,
  "costPrice": 5.25,
  "sellingPrice": 12.5,
  "lowStockThreshold": 10
}
```

Response (201 Created):

```json
{
  "product": {
    "id": "product-cuid",
    "organizationId": "org-cuid",
    "name": "Blue Widget",
    "sku": "BW-001",
    "description": "A useful widget.",
    "quantityOnHand": 20,
    "costPrice": 5.25,
    "sellingPrice": 12.5,
    "lowStockThreshold": 10,
    "lastUpdatedBy": "user@example.com",
    "createdAt": "2026-07-01T00:00:00.000Z",
    "updatedAt": "2026-07-01T00:00:00.000Z"
  }
}
```

Common errors:
- `400` validation failed
- `409` duplicate SKU within the organization
- `500` internal server error

### GET /api/products/:id

Fetch a single product by its ID.

Response (200 OK):

```json
{
  "product": {
    "id": "product-cuid",
    "organizationId": "org-cuid",
    "name": "Blue Widget",
    "sku": "BW-001",
    "description": "A useful widget.",
    "quantityOnHand": 20,
    "costPrice": 5.25,
    "sellingPrice": 12.5,
    "lowStockThreshold": 10,
    "lastUpdatedBy": "user@example.com",
    "createdAt": "2026-07-01T00:00:00.000Z",
    "updatedAt": "2026-07-01T00:00:00.000Z",
    "effectiveLowStockThreshold": 10,
    "isLowStock": false
  }
}
```

Common errors:
- `401` unauthorized
- `404` product not found

### PUT /api/products/:id

Update an existing product.

Request body: same schema as POST `/api/products`.

Response (200 OK):

```json
{
  "product": {
    "id": "product-cuid",
    "organizationId": "org-cuid",
    "name": "Blue Widget Updated",
    "sku": "BW-001",
    "description": "Updated description.",
    "quantityOnHand": 22,
    "costPrice": 5.25,
    "sellingPrice": 13.0,
    "lowStockThreshold": 10,
    "lastUpdatedBy": "user@example.com",
    "createdAt": "2026-07-01T00:00:00.000Z",
    "updatedAt": "2026-07-02T00:00:00.000Z"
  }
}
```

Common errors:
- `400` validation failed
- `404` product not found
- `409` duplicate SKU within the organization
- `500` internal server error

### PATCH /api/products/:id

Adjust product stock quantity by a positive or negative integer.

Request body:

```json
{
  "adjustment": -2,
  "note": "Sold two units"
}
```

Response (200 OK):

```json
{
  "product": {
    "id": "product-cuid",
    "quantityOnHand": 18,
    "lastUpdatedBy": "user@example.com",
    "updatedAt": "2026-07-02T00:00:00.000Z"
  }
}
```

Common errors:
- `400` adjustment invalid or results in negative quantity
- `404` product not found
- `500` internal server error

### DELETE /api/products/:id

Delete a product permanently.

Response (200 OK):

```json
{
  "success": true
}
```

Common errors:
- `401` unauthorized
- `404` product not found

## Dashboard

### GET /api/dashboard

Return summary metrics and low-stock items for the current organization.

Response (200 OK):

```json
{
  "summary": {
    "totalProducts": 10,
    "totalQuantity": 250,
    "lowStockCount": 3
  },
  "lowStockItems": [
    {
      "id": "product-cuid",
      "name": "Yellow Widget",
      "sku": "YW-001",
      "quantityOnHand": 2,
      "lowStockThreshold": 5
    }
  ],
  "organizationName": "Acme Inventory"
}
```

## Settings

### GET /api/settings

Fetch organization settings.

Response (200 OK):

```json
{
  "settings": {
    "id": "org-cuid",
    "name": "Acme Inventory",
    "defaultLowStockThreshold": 5
  }
}
```

### PUT /api/settings

Update organization settings.

Request body:

```json
{
  "defaultLowStockThreshold": 7
}
```

Response (200 OK):

```json
{
  "settings": {
    "id": "org-cuid",
    "name": "Acme Inventory",
    "defaultLowStockThreshold": 7
  }
}
```

Common errors:
- `400` validation failed
- `404` organization not found
- `500` internal server error

## Request validation

The API uses Zod schemas for request validation.

### Signup schema

- `email`: required, valid email
- `password`: minimum 8 characters
- `confirmPassword`: must match `password`
- `organizationName`: 2–100 characters

### Login schema

- `email`: required, valid email
- `password`: required

### Product schema

- `name`: required, max 200
- `sku`: required, max 100
- `description`: optional, max 1000
- `quantityOnHand`: integer ≥ 0
- `costPrice`: optional number ≥ 0
- `sellingPrice`: optional number ≥ 0
- `lowStockThreshold`: optional integer ≥ 0

### Stock adjustment schema

- `adjustment`: non-zero integer
- `note`: optional, max 500

### Settings schema

- `defaultLowStockThreshold`: integer ≥ 0

## Authorization

All protected API routes require a valid session token stored in the `stockflow-token` cookie. The API does not use bearer tokens in request headers.

The session token includes:
- `userId`
- `organizationId`
- `email`

The middleware blocks access if the cookie is missing or invalid.

## Error format

Errors are returned with a JSON payload like:

```json
{
  "error": "Error message"
}
```

Validation failures include field-specific messages:

```json
{
  "error": "Validation failed",
  "fieldErrors": {
    "email": "Enter a valid email address"
  }
}
```

## Sample cURL requests

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookie.txt
```

List products using saved cookie:

```bash
curl http://localhost:3000/api/products \
  -b cookie.txt
```

Create product:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Blue Widget","sku":"BW-001","quantityOnHand":20}' \
  -b cookie.txt
```

## Data model summary

- `Organization`: id, name, defaultLowStockThreshold, users, products
- `User`: id, email, passwordHash, organizationId
- `Product`: id, organizationId, name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold, lastUpdatedBy
