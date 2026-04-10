# Complete API Response Example

## POST /api/loans - Create Loan

### Request Payload

```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer <your_token>" \
  -F "bank_id=507f1f77bcf86cd799439011" \
  -F "full_name=Ramesh Kumar" \
  -F "dob=1985-06-15" \
  -F "mobile=9876543210" \
  -F "address=123 Main Street, Chennai" \
  -F "account_number=SBI12345" \
  -F "nominee_name=Suresh Kumar" \
  -F "nominee_dob=2005-03-20" \
  -F "ltv=75" \
  -F 'items=[{"category_id":"507f1f77bcf86cd799439012","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":1,"item_note":"Customer gold necklace"}]' \
  -F "item_image=@/path/to/image.jpg"
```

### Complete Response Structure

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
    "account_number": "SBI12345",
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

---

## Field Locations

### ✅ Item Level Fields (inside `items[]` array)

```json
{
  "items": [
    {
      "category_id": { "_id": "...", "name": "Necklace" },
      "gross_weight": 12.5,
      "net_weight": 11.8,
      "carat": 22,
      "rate_per_gram": 5800,
      "rate_per_gram_display": "₹5,800.00",
      "total_items": 1,
      "item_note": "Customer gold necklace",          // ✅ HERE
      "market_value": 68440,
      "market_value_display": "₹68,440.00"
    }
  ]
}
```

### ✅ Loan Level Fields (at root of `data` object)

```json
{
  "data": {
    "total_market_value": 68440,
    "total_market_value_display": "₹68,440.00",
    
    "market_value_for_gold": 68440,                   // ✅ HERE
    "market_value_for_gold_display": "₹68,440.00",   // ✅ HERE
    
    "max_permissible_limit": 51330,                   // ✅ HERE
    "max_permissible_limit_display": "₹51,330.00",   // ✅ HERE
    
    "loan_value": 51330,
    "loan_value_display": "₹51,330.00",
    
    "final_amount": 51330,
    "final_amount_display": "₹51,330.00"
  }
}
```

---

## Calculation Example

### Input:
- Net Weight: 11.8g
- Rate per gram: ₹5,800
- Total Items: 1
- LTV: 75%

### Calculations:
```
market_value (per item) = 11.8 × 5,800 = ₹68,440.00

total_market_value = 68,440 × 1 = ₹68,440.00

market_value_for_gold = 68,440.00 (same as total_market_value)

max_permissible_limit = 68,440 × (75 / 100) = ₹51,330.00

loan_value = 51,330.00 (same as max_permissible_limit)

final_amount = 51,330.00 (defaults to loan_value)
```

---

## Multiple Items Example

### Request:
```json
{
  "items": [
    {
      "category_id": "...",
      "net_weight": 11.8,
      "rate_per_gram": 5800,
      "total_items": 2,
      "item_note": "Gold necklace set"
    },
    {
      "category_id": "...",
      "net_weight": 7.5,
      "rate_per_gram": 6200,
      "total_items": 1,
      "item_note": "Wedding ring"
    }
  ],
  "ltv": 80
}
```

### Response:
```json
{
  "items": [
    {
      "net_weight": 11.8,
      "rate_per_gram": 5800,
      "total_items": 2,
      "item_note": "Gold necklace set",
      "market_value": 68440,
      "market_value_display": "₹68,440.00"
    },
    {
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
```

### Calculation:
```
Item 1: 68,440 × 2 = ₹1,36,880
Item 2: 46,500 × 1 = ₹46,500
Total: ₹1,83,380

LTV 80%: 1,83,380 × 0.80 = ₹1,46,704
```

---

## All GET Endpoints Return Same Structure

✅ `GET /api/loans` - All loans  
✅ `GET /api/loans/:id` - Single loan  
✅ `GET /api/loans/history` - Loan history  
✅ `POST /api/loans/by-date` - Loans by date  

All return the same complete structure with:
- `item_note` inside each item
- `market_value_for_gold` at loan level
- `max_permissible_limit` at loan level
- All `*_display` fields with ₹ formatting
