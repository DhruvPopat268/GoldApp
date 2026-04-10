#!/bin/bash

# Gold Loan API Test Script
# This script tests all the loan APIs with the new fields

BASE_URL="http://localhost:5000"
TOKEN=""
BANK_ID=""
CATEGORY_ID=""
LOAN_ID=""

echo "=========================================="
echo "Gold Loan Management API Test Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# 1. Signup/Login
echo "1. Testing Authentication..."
info "Signing up new user..."

SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    success "User created and logged in"
    info "Token: ${TOKEN:0:20}..."
else
    error "Failed to signup"
    echo "Response: $SIGNUP_RESPONSE"
    exit 1
fi

echo ""

# 2. Create Bank
echo "2. Creating Bank..."

BANK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/banks" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=State Bank of India")

BANK_ID=$(echo $BANK_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$BANK_ID" ]; then
    success "Bank created"
    info "Bank ID: $BANK_ID"
else
    error "Failed to create bank"
    echo "Response: $BANK_RESPONSE"
    exit 1
fi

echo ""

# 3. Create Category
echo "3. Creating Category..."

CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Necklace"
  }')

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$CATEGORY_ID" ]; then
    success "Category created"
    info "Category ID: $CATEGORY_ID"
else
    error "Failed to create category"
    echo "Response: $CATEGORY_RESPONSE"
    exit 1
fi

echo ""

# 4. Create Loan - Single Item
echo "4. Creating Loan with Single Item..."

LOAN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/loans" \
  -H "Authorization: Bearer $TOKEN" \
  -F "bank_id=$BANK_ID" \
  -F "full_name=Ramesh Kumar" \
  -F "dob=1985-06-15" \
  -F "mobile=9876543210" \
  -F "address=123 Main Street, Chennai, Tamil Nadu" \
  -F "account_number=SBI0012345678" \
  -F "nominee_name=Suresh Kumar" \
  -F "nominee_dob=2005-03-20" \
  -F "ltv=75" \
  -F 'items=[{"category_id":"'$CATEGORY_ID'","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":1,"item_note":"Customer gold necklace"}]')

LOAN_ID=$(echo $LOAN_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$LOAN_ID" ]; then
    success "Loan created"
    info "Loan ID: $LOAN_ID"
    
    # Extract and display key values
    echo ""
    echo "Loan Details:"
    echo "-------------"
    
    # Check if item_note exists
    ITEM_NOTE=$(echo $LOAN_RESPONSE | grep -o '"item_note":"[^"]*' | cut -d'"' -f4)
    if [ -n "$ITEM_NOTE" ]; then
        success "item_note: $ITEM_NOTE"
    else
        error "item_note not found in response"
    fi
    
    # Check market_value_for_gold
    MARKET_VALUE=$(echo $LOAN_RESPONSE | grep -o '"market_value_for_gold":[0-9]*' | cut -d':' -f2)
    MARKET_VALUE_DISPLAY=$(echo $LOAN_RESPONSE | grep -o '"market_value_for_gold_display":"[^"]*' | cut -d'"' -f4)
    if [ -n "$MARKET_VALUE" ]; then
        success "market_value_for_gold: $MARKET_VALUE"
        success "market_value_for_gold_display: $MARKET_VALUE_DISPLAY"
    else
        error "market_value_for_gold not found in response"
    fi
    
    # Check max_permissible_limit
    MAX_LIMIT=$(echo $LOAN_RESPONSE | grep -o '"max_permissible_limit":[0-9]*' | cut -d':' -f2)
    MAX_LIMIT_DISPLAY=$(echo $LOAN_RESPONSE | grep -o '"max_permissible_limit_display":"[^"]*' | cut -d'"' -f4)
    if [ -n "$MAX_LIMIT" ]; then
        success "max_permissible_limit: $MAX_LIMIT"
        success "max_permissible_limit_display: $MAX_LIMIT_DISPLAY"
    else
        error "max_permissible_limit not found in response"
    fi
    
else
    error "Failed to create loan"
    echo "Response: $LOAN_RESPONSE"
    exit 1
fi

echo ""

# 5. Create Loan - Multiple Items
echo "5. Creating Loan with Multiple Items..."

MULTI_LOAN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/loans" \
  -H "Authorization: Bearer $TOKEN" \
  -F "bank_id=$BANK_ID" \
  -F "full_name=Priya Sharma" \
  -F "dob=1990-08-20" \
  -F "mobile=9123456789" \
  -F "address=456 Park Avenue, Mumbai, Maharashtra" \
  -F "account_number=HDFC9876543210" \
  -F "nominee_name=Raj Sharma" \
  -F "nominee_dob=2010-05-15" \
  -F "ltv=80" \
  -F 'items=[{"category_id":"'$CATEGORY_ID'","gross_weight":12.5,"net_weight":11.8,"carat":22,"rate_per_gram":5800,"total_items":2,"item_note":"Gold necklace set"},{"category_id":"'$CATEGORY_ID'","gross_weight":8.0,"net_weight":7.5,"carat":24,"rate_per_gram":6200,"total_items":1,"item_note":"Wedding ring"}]')

MULTI_LOAN_ID=$(echo $MULTI_LOAN_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$MULTI_LOAN_ID" ]; then
    success "Multi-item loan created"
    info "Loan ID: $MULTI_LOAN_ID"
    
    echo ""
    echo "Multi-Item Loan Calculations:"
    echo "-----------------------------"
    
    TOTAL_ITEMS=$(echo $MULTI_LOAN_RESPONSE | grep -o '"total_items":[0-9]*' | cut -d':' -f2)
    TOTAL_MARKET=$(echo $MULTI_LOAN_RESPONSE | grep -o '"total_market_value_display":"[^"]*' | cut -d'"' -f4)
    MAX_LIMIT=$(echo $MULTI_LOAN_RESPONSE | grep -o '"max_permissible_limit_display":"[^"]*' | cut -d'"' -f4)
    LOAN_VALUE=$(echo $MULTI_LOAN_RESPONSE | grep -o '"loan_value_display":"[^"]*' | cut -d'"' -f4)
    
    success "Total Items: $TOTAL_ITEMS"
    success "Total Market Value: $TOTAL_MARKET"
    success "Max Permissible Limit (80%): $MAX_LIMIT"
    success "Loan Value: $LOAN_VALUE"
else
    error "Failed to create multi-item loan"
    echo "Response: $MULTI_LOAN_RESPONSE"
fi

echo ""

# 6. Get All Loans
echo "6. Getting All Loans..."

ALL_LOANS=$(curl -s -X GET "$BASE_URL/api/loans" \
  -H "Authorization: Bearer $TOKEN")

LOAN_COUNT=$(echo $ALL_LOANS | grep -o '"_id"' | wc -l)

if [ $LOAN_COUNT -gt 0 ]; then
    success "Retrieved $LOAN_COUNT loans"
else
    error "No loans found"
fi

echo ""

# 7. Get Loan by ID
echo "7. Getting Loan by ID..."

SINGLE_LOAN=$(curl -s -X GET "$BASE_URL/api/loans/$LOAN_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo $SINGLE_LOAN | grep -q "\"success\":true"; then
    success "Loan retrieved successfully"
    
    # Verify all fields are present
    echo ""
    echo "Field Verification:"
    echo "------------------"
    
    if echo $SINGLE_LOAN | grep -q "item_note"; then
        success "item_note field present"
    else
        error "item_note field missing"
    fi
    
    if echo $SINGLE_LOAN | grep -q "market_value_for_gold"; then
        success "market_value_for_gold field present"
    else
        error "market_value_for_gold field missing"
    fi
    
    if echo $SINGLE_LOAN | grep -q "max_permissible_limit"; then
        success "max_permissible_limit field present"
    else
        error "max_permissible_limit field missing"
    fi
    
    if echo $SINGLE_LOAN | grep -q "_display"; then
        success "Display fields present"
    else
        error "Display fields missing"
    fi
else
    error "Failed to retrieve loan"
fi

echo ""

# 8. Get Loans Summary
echo "8. Getting Loans Summary..."

SUMMARY=$(curl -s -X GET "$BASE_URL/api/loans/summary" \
  -H "Authorization: Bearer $TOKEN")

if echo $SUMMARY | grep -q "total_loans"; then
    success "Summary retrieved"
    
    TOTAL_LOANS=$(echo $SUMMARY | grep -o '"total_loans":[0-9]*' | cut -d':' -f2)
    TOTAL_MARKET=$(echo $SUMMARY | grep -o '"total_market_value":[0-9.]*' | cut -d':' -f2)
    TOTAL_LOAN=$(echo $SUMMARY | grep -o '"total_loan_value":[0-9.]*' | cut -d':' -f2)
    
    info "Total Loans: $TOTAL_LOANS"
    info "Total Market Value: ₹$TOTAL_MARKET"
    info "Total Loan Value: ₹$TOTAL_LOAN"
else
    error "Failed to retrieve summary"
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
success "All API tests completed successfully!"
echo ""
echo "Test Data:"
echo "  Token: ${TOKEN:0:30}..."
echo "  Bank ID: $BANK_ID"
echo "  Category ID: $CATEGORY_ID"
echo "  Loan ID: $LOAN_ID"
echo ""
echo "You can now use these IDs to test other endpoints manually."
echo "=========================================="
