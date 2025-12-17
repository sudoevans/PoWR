import hre from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("Testing Basescan API key configuration...\n");

  const config = hre.config;
  const apiKey = config.etherscan?.apiKey?.baseSepolia;

  if (!apiKey) {
    console.log("❌ No Basescan API key found in hardhat.config.ts");
    console.log("   Make sure BASESCAN_API_KEY is set in .env file");
    return;
  }

  console.log("✅ API key found in config");
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  console.log("\nTesting API key with Basescan...");

  try {
    // Test the API key by checking if we can access Basescan API
    const response = await fetch(
      `https://api-sepolia.basescan.org/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "1" || data.result) {
      console.log("✅ API key is valid and working!");
      console.log(`   Latest block: ${parseInt(data.result, 16)}`);
    } else {
      console.log("⚠️  API key may be invalid or rate limited");
      console.log(`   Response: ${JSON.stringify(data)}`);
    }
  } catch (error: any) {
    console.log("❌ Error testing API key:", error.message);
  }

  console.log("\n📝 To verify a contract after deployment, run:");
  console.log("   npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

