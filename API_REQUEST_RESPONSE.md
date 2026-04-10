# 📡 Complete API Request & Response Documentation

## POST /api/loans - Create Loan

### 🔐 Authentication
```
Authorization: Bearer <your_jwt_token>
```

### 📤 Request Body (multipart/form-data)

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `bank_id` | text | Bank ID (must belong to user) | `507f1f77bcf86cd799439011` |
| `full_name` | text | Customer full name (max 150) | `Ramesh Kumar` |
| `dob` | text | Date of birth (YYYY-MM-DD, past date) | `1985-06-15` |
| `mobile` | text | Indian mobile (10 digits, starts 6-9) | `9876543210` |
| `address` | text | Customer address (max 500) | `123 Main Street, Chennai` |
| `account_number` | text | Account number (5-20 alphanumeric) | `SBI0012345678` |
| `nominee_name` | text | Nominee full name (max 150) | `Suresh Kumar` |
| `nominee_dob` | text | Nominee DOB (YYYY-MM-DD, past date) | `2005-03-20` |
| `items` | text (JSON) | Array of gold items (min 1) | See below |

#### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `ltv` | number | Loan-to-Value percentage | `75` |
| `gold_purity` | text | Gold purity (18K/20K/22K/24K) | `null` |
| `market_value_per_gram` | number | Market value per gram | `null` |
| `final_amount` | number | Final loan amount | Auto-calculated |
| `advanced_value_type` | text | Value type | `LTV` |
| `item_image` | file | Gold item images (max 10, 5MB each) | `[]` |

#### Items JSON Format

```json
[
  {
    "category_id": "507f1f77bcf86cd799439012",
    "gross_weight": 12.5,
    "net_weight": 11.8,
    "carat": 22,
    "rate_per_gram": 5800,
    "total_items": 1,
    "item_note": "Customer gold necklace"
  }
]
```

**Item Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `category_id` | string | Yes | Must exist and belong to user |
| `gross_weight` | number | Yes | > 0 |
| `net_weight` | number | Yes | > 0, ≤ gross_weight |
| `carat` | number | Yes | 18, 20, 22, or 24 |
| `rate_per_gram` | number | Yes | > 0 |
| `total_items` | number | No | ≥ 1 (default: 1) |
| `item_note` | string | No | Max 500 characters |

---

### 📥 Complete Response

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Loan created successfully",
  "data": {
    "_id": "67890abcdef1234567890abc",
    "user_id": "507f1f77bcf86cd799439010",
    
    "bank_id": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "State Bank of India",
      "logo": "/uploads/banks/sbi-logo.png"
    },
    
    "full_name": "Ramesh Kumar",
    "dob": "1985-06-15T00:00:00.000Z",
    "mobile": "9876543210",
    "address": "123 Main Street, Chennai",
    "account_number": "SBI0012345678",
    "nominee_name": "Suresh Kumar",
    "nominee_dob": "2005-03-20T00:00:00.000Z",
    
    "ltv": 75,
    "gold_purity": null,
    "market_value_per_gram": null,
    "advanced_value_type": "LTV",
    
    "items": [
      {
        "_id": "67890abcdef1234567890abd",
        "category_id": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Necklace"
        },
        "gross_weight": 12.5,
        "net_weight": 11.8,
        "carat": 22,
        "rate_per_gram": 5800,
        "rate_per_gram_display": "₹5,800.00",
        "total_items": 1,
        "item_note": "Customer gold necklace",
        "market_value": 68440,
        "market_value_display": "₹68,440.00"
      }
    ],
    
    "total_items": 1,
    
    "total_market_value": 68440,
    "total_market_value_display": "₹68,440.00",
    
    "market_value_for_gold": 68440,
    "market_value_for_gold_display": "₹68,440.00",
    
    "max_permissible_limit": 51330,
    "max_permissible_limit_display": "₹51,330.00",
    
    "loan_value": 51330,
    "loan_value_display": "₹51,330.00",
    
    "final_amount": 51330,
    "final_amount_display": "₹51,330.00",
    
    "images": [
      "/uploads/gold_items/abc123-uuid.jpg"
    ],
    
    "pdf_path": null,
    "is_deleted": false,
    "deleted_at": null,
    
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Response Field Descriptions

**Customer Information:**
- `full_name`, `dob`, `mobile`, `address`, `account_number`
- `nominee_name`, `nominee_dob`

**Bank Information:**
- `bank_id`: Object with `_id`, `name`, `logo`

**Items Array:**
Each item contains:
- `category_id`: Object with `_id` and `name`
- `gross_weight`, `net_weight`, `carat`
- `rate_per_gram`: Numeric value
- `rate_per_gram_display`: Formatted with ₹ symbol
- `total_items`: Quantity
- `item_note`: Custom note/comment
- `market_value`: Calculated (net_weight × rate_per_gram)
- `market_value_display`: Formatted with ₹ symbol

**Loan Calculations:**
- `total_items`: Sum of all item quantities
- `total_market_value`: Sum of all item values
- `total_market_value_display`: Formatted
- `market_value_for_gold`: Same as total_market_value
- `market_value_for_gold_display`: Formatted
- `max_permissible_limit`: total_market_value × (ltv / 100)
- `max_permissible_limit_display`: Formatted
- `loan_value`: Same as max_permissible_limit
- `loan_value_display`: Formatted
- `final_amount`: Final loan amount
- `final_amount_display`: Formatted

**Additional Fields:**
- `images`: Array of uploaded image paths
- `pdf_path`: Generated PDF path (null initially)
- `is_deleted`: Soft delete flag
- `createdAt`, `updatedAt`: Timestamps

---

### 🧪 cURL Example

```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "bank_id=507f1f77bcf86cd799439011" \
  -F "full_name=Ramesh Kumar" \
  -F "dob=1985-06-15" \
  -F "mobile=9876543210" \
  -F "address=123 Main Street, Chennai, Tamil Nadu" \
  -F "account_number=SBI0012345678" \
  -F "nominee_name=Suresh Kumar" \
  -F "nominee_dob=2005-03-20" \
  -F "ltv=75" \
  -F 'items=[{"category_id":"507f1f77bcf86cd799439012","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":1,"item_note":"Customer gold necklace"}]' \
  -F "item_image=@/path/to/gold-item-1.jpg"
```

---

### 🔴 Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Item 1: carat must be 18, 20, 22, or 24",
    "Invalid Indian mobile number"
  ]
}
```

#### Invalid JSON (400)
```json
{
  "success": false,
  "message": "Invalid items JSON format"
}
```

#### No Items (400)
```json
{
  "success": false,
  "message": "At least one item required"
}
```

#### Unauthorized (401)
```json
{
  "error": "Unauthorized: no token provided"
}
```

#### Not Found (404)
```json
{
  "success": false,
  "message": "Bank not found"
}
```

---

## GET /api/loans - Get All Loans

### 🔐 Authentication
```
Authorization: Bearer <your_jwt_token>
```

### 📤 Request
```
GET /api/loans
```

### 📥 Response (200 OK)

```json
{
  "success": true,
  "message": "Loans retrieved successfully",
  "data": [
    {
      "_id": "67890abcdef1234567890abc",
      "user_id": "507f1f77bcf86cd799439010",
      "bank_id": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "State Bank of India",
        "logo": "/uploads/banks/sbi-logo.png"
      },
      "full_name": "Ramesh Kumar",
      "mobile": "9876543210",
      "items": [
        {
          "category_id": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Necklace"
          },
          "gross_weight": 12.5,
          "net_weight": 11.8,
          "carat": 22,
          "rate_per_gram": 5800,
          "rate_per_gram_display": "₹5,800.00",
          "total_items": 1,
          "item_note": "Customer gold necklace",
          "market_value": 68440,
          "market_value_display": "₹68,440.00"
        }
      ],
      "total_market_value": 68440,
      "total_market_value_display": "₹68,440.00",
      "market_value_for_gold": 68440,
      "market_value_for_gold_display": "₹68,440.00",
      "max_permissible_limit": 51330,
      "max_permissible_limit_display": "₹51,330.00",
      "loan_value": 51330,
      "loan_value_display": "₹51,330.00",
      "final_amount": 51330,
      "final_amount_display": "₹51,330.00",
      "pdf_url": "/uploads/pdf/loan_abc123.pdf",
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

## GET /api/loans/:id - Get Loan by ID

### 🔐 Authentication
```
Authorization: Bearer <your_jwt_token>
```

### 📤 Request
```
GET /api/loans/67890abcdef1234567890abc
```

### 📥 Response (200 OK)

Same structure as POST response with all fields populated.

---

## GET /api/loans/history - Get Loans History

### 🔐 Authentication
```
Authorization: Bearer <your_jwt_token>
```

### 📤 Request
```
GET /api/loans/history?from=2024-01-01&to=2024-01-31
```

**Query Parameters:**
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

### 📥 Response (200 OK)

Returns array of loans with same structure as GET /api/loans

---

## POST /api/loans/by-date - Get Loans by Date

### 🔐 Authentication
```
Authorization: Bearer <your_jwt_token>
```

### 📤 Request Body (JSON)
```json
{
  "date": "15-01-2024",
  "bankId": "507f1f77bcf86cd799439011"
}
```

**Fields:**
- `date` (required): Date in dd-mm-yyyy format
- `bankId` (optional): Filter by specific bank

### 📥 Response (200 OK)

Returns array of loans matching the date with same structure as GET /api/loans

---

## 📊 Multiple Items Example

### Request
```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "bank_id=507f1f77bcf86cd799439011" \
  -F "full_name=Ramesh Kumar" \
  -F "dob=1985-06-15" \
  -F "mobile=9876543210" \
  -F "address=123 Main Street, Chennai" \
  -F "account_number=SBI0012345678" \
  -F "nominee_name=Suresh Kumar" \
  -F "nominee_dob=2005-03-20" \
  -F "ltv=80" \
  -F 'items=[
    {
      "category_id":"507f1f77bcf86cd799439012",
      "gross_weight":12.5,
      "net_weight":11.8,
      "carat":22,
      "rate_per_gram":5800,
      "total_items":2,
      "item_note":"Gold necklace set"
    },
    {
      "category_id":"507f1f77bcf86cd799439013",
      "gross_weight":8.0,
      "net_weight":7.5,
      "carat":24,
      "rate_per_gram":6200,
      "total_items":1,
      "item_note":"Wedding ring"
    }
  ]' \
  -F "item_image=@/path/to/necklace.jpg" \
  -F "item_image=@/path/to/ring.jpg"
```

### Response
```json
{
  "success": true,
  "message": "Loan created successfully",
  "data": {
    "items": [
      {
        "category_id": { "_id": "...", "name": "Necklace" },
        "net_weight": 11.8,
        "rate_per_gram": 5800,
        "total_items": 2,
        "item_note": "Gold necklace set",
        "market_value": 68440,
        "market_value_display": "₹68,440.00"
      },
      {
        "category_id": { "_id": "...", "name": "Ring" },
        "net_weight": 7.5,
        "rate_per_gram": 6200,
        "total_items": 1,
        "item_note": "Wedding ring",
        "market_value": 46500,
        "market_value_display": "₹46,500.00"
      }
    ],
    "total_items": 3,
    "total_market_value": 183380,
    "total_market_value_display": "₹1,83,380.00",
    "market_value_for_gold": 183380,
    "market_value_for_gold_display": "₹1,83,380.00",
    "max_permissible_limit": 146704,
    "max_permissible_limit_display": "₹1,46,704.00",
    "loan_value": 146704,
    "loan_value_display": "₹1,46,704.00",
    "final_amount": 146704,
    "final_amount_display": "₹1,46,704.00"
  }
}
```

**Calculation:**
```
Item 1: 68,440 × 2 = ₹1,36,880
Item 2: 46,500 × 1 = ₹46,500
Total: ₹1,83,380
LTV 80%: 1,83,380 × 0.80 = ₹1,46,704
```

---

## 💡 Key Points

1. **Numeric + Display Values**: All currency fields have both numeric (for calculations) and display (formatted with ₹) versions
2. **Populated References**: `bank_id` and `category_id` are populated with names
3. **Item Notes**: Each item can have a custom `item_note`
4. **Auto-Calculations**: All financial values are calculated server-side
5. **Backward Compatible**: `item_note` is optional, existing code works without changes
