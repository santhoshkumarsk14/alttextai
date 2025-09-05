// Test script for Shopify integration
// Run with: node test-shopify.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const TEST_STORE_URL = 'yourstore.myshopify.com'; // Replace with your actual store URL

// Test data
const testCredentials = {
  storeUrl: TEST_STORE_URL
};

// Test functions
async function testShopifyConnection() {
  console.log('🧪 Testing Shopify Integration...\n');

  try {
    // Test 1: Connect to Shopify
    console.log('1️⃣ Testing Shopify Connection...');
    const connectResponse = await fetch(`${BASE_URL}/api/integrations/shopify/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need to replace this with a real JWT token
      },
      body: JSON.stringify(testCredentials)
    });

    const connectResult = await connectResponse.json();
    console.log('Connection Result:', connectResult);

    if (connectResult.success) {
      console.log('✅ Shopify connection successful!\n');

      // Test 2: Fetch integrations
      console.log('2️⃣ Testing Integration Fetch...');
      const fetchResponse = await fetch(`${BASE_URL}/api/integrations`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const fetchResult = await fetchResponse.json();
      console.log('Integrations:', fetchResult);

      // Test 3: Test sync (if connected)
      if (fetchResult.integrations?.find(i => i.platform === 'shopify' && i.is_connected)) {
        console.log('\n3️⃣ Testing Product Sync...');
        const syncResponse = await fetch(`${BASE_URL}/api/integrations/shopify/sync`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });

        const syncResult = await syncResponse.json();
        console.log('Sync Result:', syncResult);
      }
    } else {
      console.log('❌ Shopify connection failed:', connectResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testShopifyConnection();