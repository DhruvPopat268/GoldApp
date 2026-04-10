#!/bin/bash

# Test User Input Fields
# Verifies that market_value_for_gold and max_permissible_limit accept user input

BASE_URL="http://localhost:5000"
TOKEN=""

echo "=========================================="
echo "Test: User Input Fields"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

# 1. Login
echo "1. Logging in..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    success "Logged in"
else
    error "Login failed"
    exit 1
fi

# 2. Create Bank
echo ""
echo "2. Creating Bank..."
BANK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/banks" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Bank")

BANK_ID=$(echo $BANK_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$BANK_ID" ]; then
    success "Bank created: $BANK_ID"
else
    error "Bank creation failed"
    exit 1
fi

# 3. Create Category
echo ""
echo "3. Creating Category..."
CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Necklace"}')

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$CATEGORY_ID" ]; then
    success "Category created: $CATEGORY_ID"
else
    error "Category creation failed"
    exit 1
fi

# 4. Test with User Input Values
echo ""
echo "4. Creating Loan with USER INPUT values..."
info "Setting market_value_for_gold = 50000"
info "Setting max_permissible_limit = 40000"

LOAN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/loans" \
  -H "Authorization: Bearer $TOKEN" \
  -F "bank_id=$BANK_ID" \
  -F "full_name=Test User" \
  -F "dob=1985-06-15" \
  -F "mobile=9876543210" \
  -F "address=Test Address" \
  -F "account_number=TEST12345" \
  -F "nominee_name=Test Nominee" \
  -F "nominee_dob=2005-03-20" \
  -F "ltv=75" \
  -F "market_value_for_gold=50000" \
  -F "max_permissible_limit=40000" \
  -F 'items=[{"category_id":"'$CATEGORY_ID'","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":1,"item_note":"Test item"}]')

echo ""
echo "Response:"
echo "$LOAN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOAN_RESPONSE"

# Extract values
MARKET_VALUE_FOR_GOLD=$(echo $LOAN_RESPONSE | grep -o '"market_value_for_gold":[0-9]*' | cut -d':' -f2)
MAX_PERMISSIBLE_LIMIT=$(echo $LOAN_RESPONSE | grep -o '"max_permissible_limit":[0-9]*' | cut -d':' -f2)

echo ""
echo "=========================================="
echo "Verification:"
echo "=========================================="

if [ "$MARKET_VALUE_FOR_GOLD" = "50000" ]; then
    success "market_value_for_gold = 50000 (USER INPUT PRESERVED!)"
else
    error "market_value_for_gold = $MARKET_VALUE_FOR_GOLD (Expected: 50000)"
fi

if [ "$MAX_PERMISSIBLE_LIMIT" = "40000" ]; then
    success "max_permissible_limit = 40000 (USER INPUT PRESERVED!)"
else
    error "max_permissible_limit = $MAX_PERMISSIBLE_LIMIT (Expected: 40000)"
fi

echo ""
echo "=========================================="
echo "Test Complete!"
echo "=========================================="

if [ "$MARKET_VALUE_FOR_GOLD" = "50000" ] && [ "$MAX_PERMISSIBLE_LIMIT" = "40000" ]; then
    success "✅ ALL TESTS PASSED!"
    echo ""
    echo "User can now enter custom values for:"
    echo "  - market_value_for_gold"
    echo "  - max_permissible_limit"
    echo ""
    echo "The API will use user input if provided,"
    echo "otherwise it will auto-calculate."
else
    error "❌ TESTS FAILED"
    echo "Please check the API implementation."
fi
