// Test the loan creation response structure
// Run this after creating a loan to see the exact response

const testResponse = {
  "success": true,
  "message": "Loan created successfully",
  "data": {
    // Customer Details
    "full_name": "Ramesh Kumar",
    "mobile": "9876543210",
    
    // Items Array - item_note is HERE
    "items": [
      {
        "category_id": { "_id": "...", "name": "Necklace" },
        "gross_weight": 12.5,
        "net_weight": 11.8,
        "carat": 22,
        "rate_per_gram": 5800,
        "rate_per_gram_display": "₹5,800.00",
        "total_items": 1,
        "item_note": "Customer gold necklace",  // ✅ ITEM NOTE HERE
        "market_value": 68440,
        "market_value_display": "₹68,440.00"
      }
    ],
    
    // Loan Level Calculations - These are at ROOT level
    "total_items": 1,
    "total_market_value": 68440,
    "total_market_value_display": "₹68,440.00",
    
    "market_value_for_gold": 68440,              // ✅ AT LOAN LEVEL
    "market_value_for_gold_display": "₹68,440.00",
    
    "max_permissible_limit": 51330,              // ✅ AT LOAN LEVEL
    "max_permissible_limit_display": "₹51,330.00",
    
    "loan_value": 51330,
    "loan_value_display": "₹51,330.00",
    
    "final_amount": 51330,
    "final_amount_display": "₹51,330.00"
  }
};

console.log("=== ITEM LEVEL FIELDS ===");
console.log("item_note:", testResponse.data.items[0].item_note);
console.log("market_value:", testResponse.data.items[0].market_value);
console.log("market_value_display:", testResponse.data.items[0].market_value_display);

console.log("\n=== LOAN LEVEL FIELDS ===");
console.log("market_value_for_gold:", testResponse.data.market_value_for_gold);
console.log("market_value_for_gold_display:", testResponse.data.market_value_for_gold_display);
console.log("max_permissible_limit:", testResponse.data.max_permissible_limit);
console.log("max_permissible_limit_display:", testResponse.data.max_permissible_limit_display);

// Expected Output:
// === ITEM LEVEL FIELDS ===
// item_note: Customer gold necklace
// market_value: 68440
// market_value_display: ₹68,440.00
//
// === LOAN LEVEL FIELDS ===
// market_value_for_gold: 68440
// market_value_for_gold_display: ₹68,440.00
// max_permissible_limit: 51330
// max_permissible_limit_display: ₹51,330.00
