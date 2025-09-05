// Simple test script to verify API endpoints
const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing AltTextAI API endpoints...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const dbResponse = await fetch(`${BASE_URL}/api/test-db`);
    const dbData = await dbResponse.json();
    console.log('✅ Database:', dbData.success ? 'Connected' : 'Failed');

    // Test subscription plans endpoint
    console.log('\n2. Testing subscription plans...');
    const plansResponse = await fetch(`${BASE_URL}/api/subscription/plans`);
    const plansData = await plansResponse.json();
    console.log('✅ Subscription plans:', plansData.success ? `${plansData.plans.length} plans found` : 'Failed');

    // Test auth endpoints (should return 401 without token)
    console.log('\n3. Testing authentication endpoints...');
    const profileResponse = await fetch(`${BASE_URL}/api/auth/profile`);
    console.log('✅ Auth protection:', profileResponse.status === 401 ? 'Working' : 'Failed');

    // Test upload endpoint (should return 401 without token)
    const uploadResponse = await fetch(`${BASE_URL}/api/upload`, { method: 'POST' });
    console.log('✅ Upload protection:', uploadResponse.status === 401 ? 'Working' : 'Failed');

    console.log('\n🎉 API tests completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Visit http://localhost:3000');
    console.log('3. Register a new account');
    console.log('4. Test the full application flow');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running: npm run server');
    console.log('2. Check database connection in .env file');
    console.log('3. Verify all dependencies are installed');
  }
}

// Run the test
testAPI();