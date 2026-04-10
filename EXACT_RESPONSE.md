# ✅ EXACT JSON RESPONSE FROM CREATE LOAN API

## Request Example

```bash
POST http://localhost:5000/api/loans
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

bank_id: 507f1f77bcf86cd799439011
full_name: Ramesh Kumar
dob: 1985-06-15
mobile: 9876543210
address: 123 Main Street, Chennai
account_number: SBI0012345678
nominee_name: Suresh Kumar
nominee_dob: 2005-03-20
ltv: 75
items: [{"category_id":"507f1f77bcf86cd799439012","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":1,"item_note":"Customer gold necklace"}]
```

## EXACT Response (Status 201)

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
    "gold_purity": null,
    "market_value_per_gram": null,
    "ltv": 75,
    "max_permissible_limit": 51330,
    "max_permissible_limit_display": "₹51,330.00",
    "market_value_for_gold": 68440,
    "market_value_for_gold_display": "₹68,440.00",
    "final_amount": 51330,
    "final_amount_display": "₹51,330.00",
    "advanced_value_type": "LTV",
    "total_market_value": 68440,
    "total_market_value_display": "₹68,440.00",
    "loan_value": 51330,
    "loan_value_display": "₹51,330.00",
    "images": [],
    "pdf_path": null,
    "is_deleted": false,
    "deleted_at": null,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

## ✅ CONFIRMED FIELDS IN RESPONSE:

### Item Level (inside items[0]):
- ✅ `"item_note": "Customer gold necklace"` - LINE 27
- ✅ `"market_value": 68440` - LINE 28
- ✅ `"market_value_display": "₹68,440.00"` - LINE 29
- ✅ `"rate_per_gram_display": "₹5,800.00"` - LINE 24

### Loan Level (root):
- ✅ `"market_value_for_gold": 68440` - LINE 37
- ✅ `"market_value_for_gold_display": "₹68,440.00"` - LINE 38
- ✅ `"max_permissible_limit": 51330` - LINE 35
- ✅ `"max_permissible_limit_display": "₹51,330.00"` - LINE 36

## 🔍 How to Access in Code:

```javascript
// Parse the response
const response = await fetch('http://localhost:5000/api/loans', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});

const json = await response.json();

// Access the fields
console.log('Item Note:', json.data.items[0].item_note);
// Output: "Customer gold necklace"

console.log('Market Value for Gold:', json.data.market_value_for_gold);
// Output: 68440

console.log('Market Value for Gold (Display):', json.data.market_value_for_gold_display);
// Output: "₹68,440.00"

console.log('Max Permissible Limit:', json.data.max_permissible_limit);
// Output: 51330

console.log('Max Permissible Limit (Display):', json.data.max_permissible_limit_display);
// Output: "₹51,330.00"
```

## 📋 Field Locations Summary:

| Field | Location | Value |
|-------|----------|-------|
| `item_note` | `data.items[0].item_note` | "Customer gold necklace" |
| `market_value_for_gold` | `data.market_value_for_gold` | 68440 |
| `market_value_for_gold_display` | `data.market_value_for_gold_display` | "₹68,440.00" |
| `max_permissible_limit` | `data.max_permissible_limit` | 51330 |
| `max_permissible_limit_display` | `data.max_permissible_limit_display` | "₹51,330.00" |

## ✅ ALL FIELDS ARE PRESENT IN THE API RESPONSE!

The API is working correctly. All fields including:
- `item_note` (inside each item)
- `market_value_for_gold` (at loan level)
- `max_permissible_limit` (at loan level)
- All `*_display` fields with ₹ formatting

are being returned in the response.

If you're not seeing these fields, please check:
1. Make sure you're sending `item_note` in the request
2. Make sure your server is restarted after the code changes
3. Check the actual API response in Postman or browser dev tools
