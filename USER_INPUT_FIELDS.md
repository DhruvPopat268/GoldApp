# 🔄 UPDATED: User Input Fields

## ✅ Changes Made

`market_value_for_gold` and `max_permissible_limit` are now **USER INPUT** fields.

---

## 📤 Request Body - Create Loan

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `bank_id` | text | Bank ID |
| `full_name` | text | Customer name |
| `dob` | text | Date of birth (YYYY-MM-DD) |
| `mobile` | text | 10 digit mobile |
| `address` | text | Address |
| `account_number` | text | Account number |
| `nominee_name` | text | Nominee name |
| `nominee_dob` | text | Nominee DOB (YYYY-MM-DD) |
| `items` | text (JSON) | Array of gold items |

### Optional Fields (User Can Enter)
| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `ltv` | number | Loan-to-Value % | 75 |
| `market_value_for_gold` | number | **User can enter custom value** | Auto: total_market_value |
| `max_permissible_limit` | number | **User can enter custom value** | Auto: total_market_value × (ltv/100) |
| `final_amount` | number | Final loan amount | Auto: max_permissible_limit |

---

## 🎯 How It Works

### Scenario 1: User Enters Custom Values

**Request:**
```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer TOKEN" \
  -F "bank_id=..." \
  -F "full_name=Ramesh Kumar" \
  -F "mobile=9876543210" \
  -F "market_value_for_gold=50000" \
  -F "max_permissible_limit=40000" \
  -F 'items=[{...}]'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_market_value": 68440,
    "total_market_value_display": "₹68,440.00",
    
    "market_value_for_gold": 50000,
    "market_value_for_gold_display": "₹50,000.00",
    
    "max_permissible_limit": 40000,
    "max_permissible_limit_display": "₹40,000.00",
    
    "loan_value": 40000,
    "loan_value_display": "₹40,000.00"
  }
}
```

✅ **User entered 50000** → Response shows **50000**  
✅ **User entered 40000** → Response shows **40000**

---

### Scenario 2: User Doesn't Enter (Auto-Calculate)

**Request:**
```bash
curl -X POST http://localhost:5000/api/loans \
  -H "Authorization: Bearer TOKEN" \
  -F "bank_id=..." \
  -F "full_name=Ramesh Kumar" \
  -F "mobile=9876543210" \
  -F "ltv=75" \
  -F 'items=[{...}]'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_market_value": 68440,
    "total_market_value_display": "₹68,440.00",
    
    "market_value_for_gold": 68440,
    "market_value_for_gold_display": "₹68,440.00",
    
    "max_permissible_limit": 51330,
    "max_permissible_limit_display": "₹51,330.00",
    
    "loan_value": 51330,
    "loan_value_display": "₹51,330.00"
  }
}
```

✅ **Auto-calculated** based on total_market_value and LTV

---

## 📋 Complete Request Example

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
  -F "ltv=75" \
  -F "market_value_for_gold=50000" \
  -F "max_permissible_limit=40000" \
  -F 'items=[{"category_id":"507f...","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":1,"item_note":"Gold necklace"}]' \
  -F "item_image=@/path/to/image.jpg"
```

---

## 📊 Field Behavior

| Field | User Input | Auto-Calculate | Priority |
|-------|------------|----------------|----------|
| `total_market_value` | ❌ No | ✅ Always | Auto only |
| `market_value_for_gold` | ✅ Yes | ✅ If not provided | User input first |
| `max_permissible_limit` | ✅ Yes | ✅ If not provided | User input first |
| `loan_value` | ❌ No | ✅ Always (= max_permissible_limit) | Auto only |
| `final_amount` | ✅ Yes | ✅ If not provided | User input first |

---

## 🧪 Test Examples

### Test 1: Custom Values
```json
{
  "market_value_for_gold": 50000,
  "max_permissible_limit": 40000
}
```
**Result:** Response shows exactly 50000 and 40000

### Test 2: Only market_value_for_gold
```json
{
  "market_value_for_gold": 60000,
  "ltv": 80
}
```
**Result:** 
- market_value_for_gold: 60000 (user input)
- max_permissible_limit: 48000 (auto: 60000 × 0.80)

### Test 3: Only max_permissible_limit
```json
{
  "max_permissible_limit": 45000
}
```
**Result:**
- market_value_for_gold: 68440 (auto: total_market_value)
- max_permissible_limit: 45000 (user input)

### Test 4: No Custom Values
```json
{
  "ltv": 75
}
```
**Result:**
- market_value_for_gold: 68440 (auto: total_market_value)
- max_permissible_limit: 51330 (auto: 68440 × 0.75)

---

## ✅ Summary

**Before:** Fields were auto-calculated only  
**After:** User can enter custom values, or let system auto-calculate

**Benefits:**
- ✅ Flexibility: User can override calculated values
- ✅ Backward Compatible: Still auto-calculates if not provided
- ✅ No Breaking Changes: Existing API calls work as before

---

## 🔄 Update Your Frontend

```javascript
// Example: User enters custom values
const formData = new FormData();
formData.append('bank_id', bankId);
formData.append('full_name', 'Ramesh Kumar');
formData.append('mobile', '9876543210');

// User can enter these values
formData.append('market_value_for_gold', 50000);  // User input
formData.append('max_permissible_limit', 40000);  // User input

formData.append('items', JSON.stringify(items));

const response = await fetch('/api/loans', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});

const data = await response.json();
console.log(data.data.market_value_for_gold);  // 50000
console.log(data.data.max_permissible_limit);  // 40000
```

---

## 📝 Postman Example

**Body (form-data):**
```
bank_id: 507f1f77bcf86cd799439011
full_name: Ramesh Kumar
dob: 1985-06-15
mobile: 9876543210
address: 123 Main Street
account_number: SBI0012345678
nominee_name: Suresh Kumar
nominee_dob: 2005-03-20
ltv: 75
market_value_for_gold: 50000          ← USER INPUT
max_permissible_limit: 40000          ← USER INPUT
items: [{"category_id":"...","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":1,"item_note":"Gold necklace"}]
```

**Response:**
```json
{
  "success": true,
  "message": "Loan created successfully",
  "data": {
    "market_value_for_gold": 50000,
    "market_value_for_gold_display": "₹50,000.00",
    "max_permissible_limit": 40000,
    "max_permissible_limit_display": "₹40,000.00"
  }
}
```

✅ **Perfect! User input is preserved!**
