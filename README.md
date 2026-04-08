# Gold Loan Management System

A production-ready Gold Loan Management Backend built with **Node.js (Express)**, **MongoDB**, and **Puppeteer**. Supports multi-tenant, user-isolated gold loan management with automatic PDF generation styled like real Indian bank appraisal forms.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [Authentication](#authentication)
- [Multi-Tenant Isolation](#multi-tenant-isolation)
- [Security Layers](#security-layers)
- [Data Models](#data-models)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Banks](#banks)
  - [Categories](#categories)
  - [Loans](#loans)
- [Business Logic](#business-logic)
- [PDF Generation](#pdf-generation)
- [File Storage](#file-storage)
- [Validation Rules](#validation-rules)
- [Error Handling](#error-handling)
- [Postman Collection](#postman-collection)
- [Quick Start Workflow](#quick-start-workflow)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth tokens |
| express-validator | Input validation |
| Multer | File / image uploads |
| Puppeteer | Headless PDF generation |
| Helmet | HTTP security headers |
| express-rate-limit | Rate limiting |
| express-mongo-sanitize | NoSQL injection prevention |
| xss | XSS sanitization |
| CORS | Restricted cross-origin support |
| UUID | Unique filenames |
| dotenv | Environment config |

---

## Project Structure

```
gold app/
├── controllers/
│   ├── authController.js       # Signup / login logic
│   ├── bankController.js       # Bank CRUD (user-scoped)
│   ├── categoryController.js   # Category CRUD (user-scoped)
│   └── loanController.js       # Loan creation, PDF trigger, delete (user-scoped)
├── middleware/
│   ├── authMiddleware.js       # JWT verification
│   ├── upload.js               # Multer config — image-only, 2MB max
│   └── validators.js           # express-validator rules for all routes
├── models/
│   ├── User.js                 # User schema (password hashed, never returned)
│   ├── Bank.js                 # Bank schema (user_id scoped)
│   ├── Category.js             # Category schema (user_id scoped, unique per user)
│   └── Loan.js                 # Loan + embedded GoldItem schema (user_id scoped)
├── routes/
│   ├── authRoutes.js           # POST /signup, POST /login (rate limited)
│   ├── bankRoutes.js           # All routes auth-protected
│   ├── categoryRoutes.js       # All routes auth-protected
│   └── loanRoutes.js           # All routes auth-protected
├── uploads/
│   ├── banks/                  # Bank logo images
│   ├── gold_items/             # Loan gold item images
│   └── pdf/                    # Generated PDF files
├── utils/
│   └── pdfGenerator.js         # Puppeteer HTML → PDF builder
├── .env                        # Environment variables
├── server.js                   # App entry point
└── postman_collection.json     # Ready-to-import Postman collection
```

---

## Environment Setup

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/goldloan
BASE_URL=http://localhost:5000
JWT_SECRET=change_this_to_a_long_random_secret_before_production
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/goldloan` |
| `BASE_URL` | Public base URL (used in PDF image URLs) | `http://localhost:5000` |
| `JWT_SECRET` | Secret key for signing JWT tokens | — |
| `NODE_ENV` | `development` = tokens never expire. `production` = 7d expiry | `development` |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:3000` |

---

## Installation

```bash
cd "gold app"
npm install
```

---

## Running the Server

```bash
# Production
npm start

# Development (requires nodemon)
npm run dev
```

Server starts at: `http://localhost:5000`

> Make sure MongoDB is running before starting the server.

---

## Authentication

All routes except `POST /api/auth/signup` and `POST /api/auth/login` require a valid JWT token.

**How to authenticate:**

1. Call `POST /api/auth/signup` or `POST /api/auth/login`
2. Copy the `token` from the response
3. Send it in every subsequent request as:

```
Authorization: Bearer <token>
```

**Token expiry:**
- `NODE_ENV=development` → token never expires (for testing)
- `NODE_ENV=production` → token expires in 7 days

---

## Multi-Tenant Isolation

Every resource (Bank, Category, Loan) is owned by the user who created it via a `user_id` field.

- On **create** → `user_id` is set from `req.user.id` (JWT payload)
- On **fetch** → filtered by `user_id`
- On **delete** → matched by both `_id` and `user_id`
- When creating a loan, `bank_id` and `category_id` are validated against the requesting user's `user_id` — cross-user references are rejected with `404`
- Category names are unique **per user** (not globally)

Users can never read, modify, or delete another user's data.

---

## Security Layers

| Layer | Detail |
|---|---|
| Helmet | Sets secure HTTP headers (XSS, clickjacking, MIME sniffing protection) |
| CORS | Restricted to origins listed in `ALLOWED_ORIGINS` |
| Rate limiting (global) | 100 requests per 15 minutes per IP |
| Rate limiting (auth) | 10 requests per 15 minutes per IP on `/api/auth/*` |
| JWT auth | All non-auth routes require a valid Bearer token |
| express-validator | Input validation on all create endpoints |
| XSS sanitization | All string body fields stripped of HTML tags before processing |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` from request body/query |
| Password hashing | bcrypt with cost factor 12, password never returned in responses |
| Multer security | MIME-type whitelist (jpg/png/webp), 2MB max, UUID filenames (never user-supplied) |
| user_id isolation | Every DB query scoped to `req.user.id` |
| Body size limit | JSON body capped at 10kb |

---

## Data Models

### User

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `name` | String | User display name (max 100) |
| `email` | String | Unique, lowercase, trimmed |
| `password` | String | bcrypt hashed — never returned in responses |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

---

### Bank

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `user_id` | ObjectId (ref: User) | Owning user |
| `name` | String | Bank name (max 150) |
| `logo` | String | Relative path to uploaded logo |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

---

### Category

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `user_id` | ObjectId (ref: User) | Owning user |
| `name` | String | Category name — unique per user (max 100) |
| `createdAt` | Date | Timestamp |

---

### Loan

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB document ID |
| `user_id` | ObjectId (ref: User) | Owning user |
| `bank_id` | ObjectId (ref: Bank) | Associated bank (must belong to same user) |
| `full_name` | String | Customer full name (max 150) |
| `dob` | Date | Customer date of birth (must be past date) |
| `mobile` | String | Indian mobile — 10 digits starting with 6–9 |
| `address` | String | Customer address (max 500) |
| `account_number` | String | 5–20 alphanumeric characters |
| `nominee_name` | String | Nominee full name (max 150) |
| `nominee_dob` | Date | Nominee date of birth (must be past date) |
| `items` | GoldItem[] | Array of pledged gold items (min 1) |
| `images` | String[] | Array of relative paths to uploaded gold item images |
| `total_market_value` | Number | Auto-calculated sum of all item market values |
| `loan_value` | Number | Auto-calculated — 75% of total market value |
| `pdf_path` | String | Relative path to generated PDF |
| `createdAt` | Date | Timestamp |

---

### GoldItem (embedded in Loan)

| Field | Type | Description |
|---|---|---|
| `category_id` | ObjectId (ref: Category) | Must belong to same user |
| `gross_weight` | Number | Total weight including impurities (grams, > 0) |
| `net_weight` | Number | Pure gold weight (grams, > 0, ≤ gross_weight) |
| `carat` | Number | Gold purity — allowed: `18`, `20`, `22`, `24` |
| `rate_per_gram` | Number | Current market rate per gram (₹, > 0) |
| `total_items` | Number | Number of items of this type (≥ 1) |
| `market_value` | Number | Auto-calculated: `net_weight × rate_per_gram` |

---

## API Reference

Base URL: `http://localhost:5000`

> All routes except `/api/auth/signup` and `/api/auth/login` require:
> `Authorization: Bearer <token>`

---

### Auth

#### `POST /api/auth/signup` — Register

- **Content-Type:** `application/json`
- **Rate limit:** 10 requests / 15 min per IP

**Request Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | String | Yes | Max 100 characters |
| `email` | String | Yes | Valid email format |
| `password` | String | Yes | Min 8 characters |

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"password123"}'
```

**Success Response `201`:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Admin", "email": "admin@example.com" }
}
```

---

#### `POST /api/auth/login` — Login

- **Content-Type:** `application/json`
- **Rate limit:** 10 requests / 15 min per IP

**Request Body:**

| Field | Type | Required |
|---|---|---|
| `email` | String | Yes |
| `password` | String | Yes |

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

**Success Response `200`:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Admin", "email": "admin@example.com" }
}
```

**Error Responses:**

| Status | Error |
|---|---|
| `400` | Validation error (invalid email, short password, etc.) |
| `401` | `Invalid email or password` |
| `429` | `Too many auth attempts, please try again later` |

---

### Banks

> All bank routes require `Authorization: Bearer <token>`

#### `POST /api/banks` — Create a Bank

- **Content-Type:** `multipart/form-data`

**Request Fields:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | text | Yes | Max 150 characters |
| `logo` | file | Yes | jpg / png / webp, max 2MB |

**Example:**
```bash
curl -X POST http://localhost:5000/api/banks \
  -H "Authorization: Bearer <token>" \
  -F "name=State Bank of India" \
  -F "logo=@/path/to/sbi_logo.png"
```

**Success Response `201`:**
```json
{
  "_id": "...",
  "user_id": "...",
  "name": "State Bank of India",
  "logo": "/uploads/banks/uuid.png",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

#### `GET /api/banks` — Get All Banks

Returns only banks belonging to the authenticated user, sorted newest first.

**Example:**
```bash
curl http://localhost:5000/api/banks \
  -H "Authorization: Bearer <token>"
```

---

### Categories

> All category routes require `Authorization: Bearer <token>`

#### `POST /api/categories` — Create a Category

- **Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | String | Yes | Max 100 characters, unique per user |

**Example:**
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Necklace"}'
```

**Success Response `201`:**
```json
{
  "_id": "...",
  "user_id": "...",
  "name": "Necklace",
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

**Suggested Categories:**
```
Chain, Ring, Necklace, Bangle, Earring, Bracelet, Anklet, Mixed Gold, Coin, Other
```

---

#### `GET /api/categories` — Get All Categories

Returns only categories belonging to the authenticated user, sorted alphabetically.

---

### Loans

> All loan routes require `Authorization: Bearer <token>`

#### `POST /api/loans` — Create a Loan

Creates a loan, calculates values, generates a 2-page PDF, and returns the loan with a PDF download URL.

- **Content-Type:** `multipart/form-data`

**Request Fields:**

| Field | Type | Required | Rules |
|---|---|---|---|
| `bank_id` | text | Yes | Must belong to authenticated user |
| `full_name` | text | Yes | Max 150 characters |
| `dob` | text | Yes | Format: `YYYY-MM-DD`, must be past date |
| `mobile` | text | Yes | 10 digits, starts with 6–9 |
| `address` | text | Yes | Max 500 characters |
| `account_number` | text | Yes | 5–20 alphanumeric characters |
| `nominee_name` | text | Yes | Max 150 characters |
| `nominee_dob` | text | Yes | Format: `YYYY-MM-DD`, must be past date |
| `items` | text (JSON string) | Yes | Array of gold items (see below) |
| `item_image` | file | No | jpg/png/webp, max 2MB — multiple images allowed (up to 10) |

**`items` JSON String Format:**
```json
[
  {
    "category_id": "<CATEGORY_ID>",
    "gross_weight": 12.5,
    "net_weight": 11.8,
    "carat": 22,
    "rate_per_gram": 5800
  }
]
```

> `category_id` must belong to the authenticated user.

**Example:**
```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer <token>" \
  -F "bank_id=<BANK_ID>" \
  -F "full_name=Ramesh Kumar" \
  -F "dob=1985-06-15" \
  -F "mobile=9876543210" \
  -F "address=123 Main Street, Chennai, Tamil Nadu" \
  -F "account_number=SBI0012345678" \
  -F "nominee_name=Suresh Kumar" \
  -F "nominee_dob=2005-03-20" \
  -F 'items=[{"category_id":"<CATEGORY_ID>","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800}]' \
  -F "item_image=@/path/to/gold_item1.jpg" \
  -F "item_image=@/path/to/gold_item2.jpg"
```

**Success Response `201`:**
```json
{
  "_id": "...",
  "user_id": "...",
  "bank_id": "...",
  "full_name": "Ramesh Kumar",
  "dob": "1985-06-15T00:00:00.000Z",
  "mobile": "9876543210",
  "address": "123 Main Street, Chennai, Tamil Nadu",
  "account_number": "SBI0012345678",
  "nominee_name": "Suresh Kumar",
  "nominee_dob": "2005-03-20T00:00:00.000Z",
  "items": [
    {
      "category_id": "...",
      "gross_weight": 12.5,
      "net_weight": 11.8,
      "carat": 22,
      "rate_per_gram": 5800,
      "market_value": 68440.00,
      "image": "/uploads/gold_items/uuid.jpg"
    }
  ],
  "total_market_value": 68440.00,
  "loan_value": 51330.00,
  "pdf_path": "/uploads/pdf/loan_uuid.pdf",
  "pdf_url": "http://localhost:5000/uploads/pdf/loan_uuid.pdf",
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses:**

| Status | Error |
|---|---|
| `400` | `bank_id is required` |
| `400` | `items must be a valid JSON string` |
| `400` | `At least one gold item is required` |
| `400` | `Item 1: all fields are required` |
| `400` | `Item 1: net_weight cannot exceed gross_weight` |
| `400` | `Item 1: carat must be 18, 20, 22, or 24` |
| `401` | `Unauthorized: no token provided` |
| `401` | `Unauthorized: token has expired` |
| `404` | `Bank not found` |
| `404` | `Item 1: category not found` |

---

#### `GET /api/loans` — Get All Loans

Returns all loans belonging to the authenticated user with populated bank and category details, sorted newest first.

---

#### `GET /api/loans/:id` — Get Loan by ID

Returns a single loan. Returns `404` if the loan belongs to a different user.

**Success Response `200`:** Full loan object plus:
```json
{ "pdf_url": "http://localhost:5000/uploads/pdf/loan_uuid.pdf" }
```

---

#### `DELETE /api/loans/:id` — Delete a Loan

Deletes the loan and removes all associated item images and PDF from disk. Returns `404` if the loan belongs to a different user.

**Success Response `200`:**
```json
{ "message": "Loan deleted successfully" }
```

---

## Business Logic

All calculations are performed server-side. Clients must never send calculated values.

```
market_value        = net_weight × rate_per_gram        (per item)
total_market_value  = sum of all item market_values
loan_value          = total_market_value × 0.75         (75% of market value)
```

**Example:**

| Item | Net Weight | Rate/gram | Market Value |
|---|---|---|---|
| Necklace | 11.8g | ₹5,800 | ₹68,440.00 |
| Ring | 7.5g | ₹4,800 | ₹36,000.00 |
| **Total** | | | **₹1,04,440.00** |
| **Loan (75%)** | | | **₹78,330.00** |

---

## PDF Generation

Auto-generated on every loan creation using Puppeteer.

### Page 1 — Gold Appraisal Memo
- Bank logo + bank name
- Memo number and date
- Customer details
- Gold items table (item, gross weight, net weight, carat, rate/gram, market value)
- Total market value and loan value (75%) summary
- Signature fields: Appraiser / Customer / Authorised Signatory

### Page 2 — Gold Item Images
- Bank logo header
- Grid layout (2 images per row)
- Each image labeled with item number and category name

### PDF Access
```
http://localhost:5000/uploads/pdf/loan_<id>_<uuid>.pdf
```

---

## File Storage

| Upload Type | Directory | Field Name | Max Size |
|---|---|---|---|
| Bank logos | `uploads/banks/` | `logo` (single file) | 2MB |
| Gold item images | `uploads/gold_items/` | `item_image_0`, `item_image_1`, ... | 2MB each |
| Generated PDFs | `uploads/pdf/` | auto-generated | — |

- All files served as static assets at `http://localhost:5000/uploads/...`
- Filenames are UUID-based — original filename is never used
- Extension derived from MIME type — never from user input
- Only `image/jpeg`, `image/png`, `image/webp` accepted
- Deleting a loan also deletes its associated images and PDF from disk

---

## Validation Rules

| Rule | Detail |
|---|---|
| All auth fields | Validated by express-validator before controller runs |
| `name` (bank/category) | Validated by express-validator before controller runs |
| All loan customer fields | Required — returns `400` if missing |
| `mobile` | 10 digits, must start with 6–9 |
| `account_number` | 5–20 alphanumeric characters |
| `dob` / `nominee_dob` | Must be valid past dates |
| `items` | Valid JSON array with at least 1 item |
| `net_weight` | Must be ≤ `gross_weight` |
| `carat` | Must be one of: `18`, `20`, `22`, `24` |
| `bank_id` | Must reference a Bank owned by the authenticated user |
| `category_id` | Must reference a Category owned by the authenticated user |
| File uploads | Only image MIME types accepted, max 2MB |

---

## Error Handling

All errors return JSON:

```json
{ "error": "Description of the error" }
```

| HTTP Status | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Unauthorized — missing, invalid, or expired token |
| `404` | Resource not found (or belongs to another user) |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error (stack trace hidden in production) |

---

## Postman Collection

A ready-to-import Postman collection is included at the root: `postman_collection.json`

**To import:**
1. Open Postman → click **Import** → select `postman_collection.json`
2. The collection uses variables — no manual copy-pasting needed:

| Variable | Set by |
|---|---|
| `{{token}}` | Auto-saved on **Login** response |
| `{{bank_id}}` | Auto-saved on **Create Bank** response |
| `{{category_id}}` | Auto-saved on **Create Category** response |
| `{{loan_id}}` | Auto-saved on **Create Loan** response |

---

## Quick Start Workflow

```
1. POST /api/auth/signup     → register a user
2. POST /api/auth/login      → get token (auto-saved in Postman)
3. POST /api/banks           → create a bank, bank_id auto-saved
4. POST /api/categories      → create categories, category_id auto-saved
5. POST /api/loans           → create loan using saved IDs
6. Open pdf_url in browser   → view generated PDF
7. GET  /api/loans/:id       → fetch loan details
8. DELETE /api/loans/:id     → delete loan and all files
```
