#!/bin/bash

# Shopify Integration Test Script
# Make sure to replace YOUR_JWT_TOKEN with a valid token from your application

BASE_URL="http://localhost:3001"
STORE_URL="yourstore.myshopify.com"  # Replace with your actual store URL
JWT_TOKEN="YOUR_JWT_TOKEN"  # Replace with actual JWT token

echo "🧪 Testing Shopify Integration"
echo "================================"

# Test 1: Connect to Shopify
echo ""
echo "1️⃣ Testing Shopify Connection..."
CONNECT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/integrations/shopify/connect" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{\"storeUrl\": \"$STORE_URL\"}")

echo "Connection Response:"
echo "$CONNECT_RESPONSE" | jq '.' 2>/dev/null || echo "$CONNECT_RESPONSE"

# Check if connection was successful
if echo "$CONNECT_RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Shopify connection successful!"

  # Test 2: Fetch integrations
  echo ""
  echo "2️⃣ Testing Integration Fetch..."
  FETCH_RESPONSE=$(curl -s "$BASE_URL/api/integrations" \
    -H "Authorization: Bearer $JWT_TOKEN")

  echo "Integrations Response:"
  echo "$FETCH_RESPONSE" | jq '.' 2>/dev/null || echo "$FETCH_RESPONSE"

  # Test 3: Test sync
  echo ""
  echo "3️⃣ Testing Product Sync..."
  SYNC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/integrations/shopify/sync" \
    -H "Authorization: Bearer $JWT_TOKEN")

  echo "Sync Response:"
  echo "$SYNC_RESPONSE" | jq '.' 2>/dev/null || echo "$SYNC_RESPONSE"

else
  echo ""
  echo "❌ Shopify connection failed"
  echo "Error details:"
  echo "$CONNECT_RESPONSE" | jq '.error' 2>/dev/null || echo "Check server logs for details"
fi

echo ""
echo "================================"
echo "Test completed!"