# 📊 Response Structure Visual Guide

## 🎯 Where to Find Each Field

```
Response
└── data (Loan Object)
    ├── _id
    ├── user_id
    ├── bank_id { _id, name, logo }
    ├── full_name
    ├── mobile
    ├── address
    ├── ltv
    │
    ├── items[] ◄─────────────────────────────┐
    │   └── [0]                                │
    │       ├── category_id { _id, name }      │
    │       ├── gross_weight                   │
    │       ├── net_weight                     │
    │       ├── carat                          │
    │       ├── rate_per_gram                  │
    │       ├── rate_per_gram_display          │
    │       ├── total_items                    │
    │       ├── item_note ◄─────────────────── ✅ ITEM NOTE IS HERE
    │       ├── market_value                   │
    │       └── market_value_display           │
    │                                           │
    ├── total_items                            │
    ├── total_market_value                     │
    ├── total_market_value_display             │
    │                                           │
    ├── market_value_for_gold ◄─────────────── ✅ LOAN LEVEL
    ├── market_value_for_gold_display          │
    │                                           │
    ├── max_permissible_limit ◄─────────────── ✅ LOAN LEVEL
    ├── max_permissible_limit_display          │
    │                                           │
    ├── loan_value                             │
    ├── loan_value_display                     │
    ├── final_amount                           │
    ├── final_amount_display                   │
    │                                           │
    ├── images[]                               │
    ├── createdAt                              │
    └── updatedAt                              │
```

---

## 📝 How to Access in Code

### JavaScript/TypeScript
```javascript
// Access item_note
const itemNote = response.data.items[0].item_note;
console.log(itemNote); // "Customer gold necklace"

// Access loan level fields
const marketValue = response.data.market_value_for_gold;
const maxLimit = response.data.max_permissible_limit;

console.log(marketValue); // 68440
console.log(maxLimit);    // 51330

// Display formatted values
console.log(response.data.market_value_for_gold_display); // "₹68,440.00"
console.log(response.data.max_permissible_limit_display); // "₹51,330.00"
```

### React Example
```jsx
function LoanDetails({ loan }) {
  return (
    <div>
      {/* Display each item */}
      {loan.items.map((item, index) => (
        <div key={index}>
          <p>Category: {item.category_id.name}</p>
          <p>Note: {item.item_note}</p>
          <p>Value: {item.market_value_display}</p>
        </div>
      ))}
      
      {/* Display loan totals */}
      <div>
        <p>Market Value: {loan.market_value_for_gold_display}</p>
        <p>Max Limit: {loan.max_permissible_limit_display}</p>
        <p>Loan Amount: {loan.loan_value_display}</p>
      </div>
    </div>
  );
}
```

---

## ✅ Checklist - All Fields Present

### Per Item (inside `items[]` array):
- [x] `category_id` (populated with name)
- [x] `gross_weight`
- [x] `net_weight`
- [x] `carat`
- [x] `rate_per_gram`
- [x] `rate_per_gram_display` ← NEW
- [x] `total_items`
- [x] `item_note` ← NEW
- [x] `market_value`
- [x] `market_value_display` ← NEW

### Loan Level (at root):
- [x] `total_items`
- [x] `total_market_value`
- [x] `total_market_value_display` ← NEW
- [x] `market_value_for_gold` ← NEW
- [x] `market_value_for_gold_display` ← NEW
- [x] `max_permissible_limit` ← NEW
- [x] `max_permissible_limit_display` ← NEW
- [x] `loan_value`
- [x] `loan_value_display` ← NEW
- [x] `final_amount`
- [x] `final_amount_display` ← NEW

---

## 🔍 If Fields Are Missing

### Check 1: Verify Request
Make sure you're sending `item_note` in the request:
```json
{
  "items": "[{\"item_note\":\"Customer gold necklace\",\"net_weight\":11.8,...}]"
}
```

### Check 2: Check Database
The fields should be saved in MongoDB. Check with:
```javascript
db.loans.findOne({}).pretty()
```

### Check 3: API Response
All fields are automatically included because:
1. Schema has the fields defined
2. Controller uses `.toObject()` which includes all fields
3. Display fields are added in controller

---

## 💡 Summary

| Field | Location | Type | Example |
|-------|----------|------|---------|
| `item_note` | `items[0].item_note` | String | "Customer gold necklace" |
| `market_value_for_gold` | `data.market_value_for_gold` | Number | 68440 |
| `market_value_for_gold_display` | `data.market_value_for_gold_display` | String | "₹68,440.00" |
| `max_permissible_limit` | `data.max_permissible_limit` | Number | 51330 |
| `max_permissible_limit_display` | `data.max_permissible_limit_display` | String | "₹51,330.00" |

All fields are present in the response! ✅
