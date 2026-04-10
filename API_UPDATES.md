# Gold Loan API Updates

## Changes Summary

### 1. New Field in Gold Items
- **`item_note`**: Optional string field (max 500 characters) for comments per item

### 2. New Fields in Loan Schema
- **`market_value_for_gold`**: Total calculated market value (same as `total_market_value`)
- **`max_permissible_limit`**: Calculated using LTV percentage

### 3. Updated Business Logic

```javascript
// Per Item Calculation
market_value = net_weight × rate_per_gram

// Loan Level Calculations
total_market_value = sum of (market_value × total_items) for all items
market_value_for_gold = total_market_value
max_permissible_limit = total_market_value × (ltv / 100)
loan_value = max_permissible_limit
```

---

## API Endpoint

**POST** `/api/loans`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

---

## Request Payload Example

```javascript
// Form Data Fields:

bank_id: "507f1f77bcf86cd799439011"
full_name: "Ramesh Kumar"
dob: "1985-06-15"
mobile: "9876543210"
address: "123 Main Street, Chennai, Tamil Nadu"
account_number: "SBI0012345678"
nominee_name: "Suresh Kumar"
nominee_dob: "2005-03-20"

// NEW: LTV percentage (optional, defaults to 75)
ltv: 80

// Items as JSON string
items: '[
  {
    "category_id": "507f1f77bcf86cd799439012",
    "gross_weight": 12.5,
    "net_weight": 11.8,
    "carat": 22,
    "rate_per_gram": 5800,
    "total_items": 2,
    "item_note": "Gold necklace with intricate design"
  },
  {
    "category_id": "507f1f77bcf86cd799439013",
    "gross_weight": 8.0,
    "net_weight": 7.5,
    "carat": 24,
    "rate_per_gram": 6200,
    "total_items": 1,
    "item_note": "Wedding ring - 24K pure gold"
  }
]'

// Optional: Item images (up to 10)
item_image: <file1.jpg>
item_image: <file2.jpg>
```

---

## Response Example

**Status:** `201 Created`

```json
{
  "success": true,
  "message": "Loan created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "user_id": "507f1f77bcf86cd799439010",
    "bank_id": "507f1f77bcf86cd799439011",
    "full_name": "Ramesh Kumar",
    "dob": "1985-06-15T00:00:00.000Z",
    "mobile": "9876543210",
    "address": "123 Main Street, Chennai, Tamil Nadu",
    "account_number": "SBI0012345678",
    "nominee_name": "Suresh Kumar",
    "nominee_dob": "2005-03-20T00:00:00.000Z",
    "ltv": 80,
    "items": [
      {
        "category_id": "507f1f77bcf86cd799439012",
        "gross_weight": 12.5,
        "net_weight": 11.8,
        "carat": 22,
        "rate_per_gram": 5800,
        "total_items": 2,
        "item_note": "Gold necklace with intricate design",
        "market_value": 68440.00,
        "_id": "507f1f77bcf86cd799439015"
      },
      {
        "category_id": "507f1f77bcf86cd799439013",
        "gross_weight": 8.0,
        "net_weight": 7.5,
        "carat": 24,
        "rate_per_gram": 6200,
        "total_items": 1,
        "item_note": "Wedding ring - 24K pure gold",
        "market_value": 46500.00,
        "_id": "507f1f77bcf86cd799439016"
      }
    ],
    "total_items": 3,
    "total_market_value": 183380.00,
    "market_value_for_gold": 183380.00,
    "max_permissible_limit": 146704.00,
    "loan_value": 146704.00,
    "final_amount": 146704.00,
    "images": [
      "/uploads/gold_items/uuid1.jpg",
      "/uploads/gold_items/uuid2.jpg"
    ],
    "is_deleted": false,
    "deleted_at": null,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## Calculation Breakdown

### Item 1: Gold Necklace
```
net_weight = 11.8g
rate_per_gram = ₹5,800
total_items = 2

market_value (per item) = 11.8 × 5,800 = ₹68,440.00
total_value = 68,440 × 2 = ₹136,880.00
```

### Item 2: Wedding Ring
```
net_weight = 7.5g
rate_per_gram = ₹6,200
total_items = 1

market_value (per item) = 7.5 × 6,200 = ₹46,500.00
total_value = 46,500 × 1 = ₹46,500.00
```

### Loan Totals
```
total_market_value = 136,880 + 46,500 = ₹183,380.00
market_value_for_gold = ₹183,380.00 (same as total_market_value)

ltv = 80%
max_permissible_limit = 183,380 × (80 / 100) = ₹146,704.00
loan_value = ₹146,704.00
final_amount = ₹146,704.00 (defaults to loan_value if not provided)
```

---

## Validation Rules

### Item Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `category_id` | ObjectId | Yes | Must exist and belong to user |
| `gross_weight` | Number | Yes | > 0 |
| `net_weight` | Number | Yes | > 0, ≤ gross_weight |
| `carat` | Number | Yes | Must be 18, 20, 22, or 24 |
| `rate_per_gram` | Number | Yes | > 0 |
| `total_items` | Number | No | ≥ 1 (default: 1) |
| `item_note` | String | No | Max 500 characters |

### Loan Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `mobile` | String | Yes | 10 digits, starts with 6-9 |
| `account_number` | String | Yes | 5-20 alphanumeric |
| `ltv` | Number | No | Default: 75 |

---

## Error Responses

### Validation Error
**Status:** `400 Bad Request`

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

### Invalid Items JSON
**Status:** `400 Bad Request`

```json
{
  "success": false,
  "message": "Invalid items JSON format"
}
```

### No Items
**Status:** `400 Bad Request`

```json
{
  "success": false,
  "message": "At least one item required"
}
```

---

## Backward Compatibility

- **`item_note`** is optional - existing API calls without this field will continue to work
- All existing calculations remain unchanged
- New fields are auto-calculated, no client changes required for basic functionality
- Default LTV is 75% if not provided

---

## cURL Example

```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer eyJhbGci..." \
  -F "bank_id=507f1f77bcf86cd799439011" \
  -F "full_name=Ramesh Kumar" \
  -F "dob=1985-06-15" \
  -F "mobile=9876543210" \
  -F "address=123 Main Street, Chennai, Tamil Nadu" \
  -F "account_number=SBI0012345678" \
  -F "nominee_name=Suresh Kumar" \
  -F "nominee_dob=2005-03-20" \
  -F "ltv=80" \
  -F 'items=[{"category_id":"507f1f77bcf86cd799439012","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":2,"item_note":"Gold necklace with intricate design"}]' \
  -F "item_image=@/path/to/image1.jpg"
```

---

## Testing Checklist

- [ ] Create loan with `item_note` field
- [ ] Create loan without `item_note` field (backward compatibility)
- [ ] Verify `market_value_for_gold` equals `total_market_value`
- [ ] Verify `max_permissible_limit` calculation with custom LTV
- [ ] Verify `max_permissible_limit` calculation with default LTV (75%)
- [ ] Test with multiple items
- [ ] Test with single item
- [ ] Verify all calculations are rounded to 2 decimal places
