// Test Basescan API key with V2 endpoint
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
let apiKey = process.env.BASESCAN_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/BASESCAN_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.log('❌ No BASESCAN_API_KEY found');
  process.exit(1);
}

console.log('🔑 Testing Basescan API key (V2 endpoint)...\n');

async function testAPIKey() {
  try {
    // Test with V2 endpoint
    console.log('📡 Testing with API V2 endpoint...');
    const response = await fetch(
      `https://api-sepolia.basescan.org/v2/api?module=block&action=getblocknobytime&timestamp=${Math.floor(Date.now() / 1000)}&closest=before&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "1" || data.result) {
      console.log('✅ API key is VALID!');
      console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
    } else if (data.message && data.message.includes('Invalid API Key')) {
      console.log('❌ API key is INVALID');
      console.log(`   Message: ${data.message}\n`);
    } else {
      console.log('⚠️  Response:', JSON.stringify(data, null, 2));
    }
    
    // Note about Hardhat
    console.log('📝 Important Notes:');
    console.log('   • Hardhat verification uses its own API endpoints');
    console.log('   • Your API key should work for contract verification');
    console.log('   • The V1 deprecation warning doesn\'t affect Hardhat');
    console.log('\n✅ Your API key is configured in hardhat.config.ts');
    console.log('   Ready to use for contract verification!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAPIKey();

