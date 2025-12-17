// Simple script to test Basescan API key
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
  console.log('   Make sure BASESCAN_API_KEY is set in .env file');
  process.exit(1);
}

console.log('🔑 Testing Basescan API key...\n');
console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

// Test the API key
async function testAPIKey() {
  try {
    console.log('📡 Testing API connection to Base Sepolia...');
    const response = await fetch(
      `https://api-sepolia.basescan.org/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "1" && data.result) {
      const blockNumber = parseInt(data.result, 16);
      console.log('✅ API key is VALID and working!');
      console.log(`   Latest block on Base Sepolia: ${blockNumber.toLocaleString()}\n`);
      
      console.log('✅ Your API key is configured correctly!');
      console.log('\n📝 Ready to use for:');
      console.log('   • Contract verification');
      console.log('   • Source code verification');
      console.log('   • Transaction lookups');
      console.log('\n💡 To verify a contract after deployment:');
      console.log('   npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>');
    } else {
      console.log('⚠️  Unexpected API response:', JSON.stringify(data, null, 2));
      if (data.message && data.message.includes('Invalid API Key')) {
        console.log('\n❌ API key appears to be invalid');
      }
    }
  } catch (error) {
    console.log('❌ Error testing API key:', error.message);
    if (error.message.includes('fetch')) {
      console.log('\n💡 Note: Node.js 18+ has built-in fetch support');
      console.log('   If you see this error, try updating Node.js');
    }
  }
}

testAPIKey();
