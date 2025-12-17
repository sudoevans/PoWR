
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function debugBlockchain() {
  console.log("--- Blockchain Debug Script ---");

  // 1. Check Env Vars
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Private Key present: ${!!privateKey}`);

  if (!privateKey) {
    console.error("❌ ERROR: BLOCKCHAIN_PRIVATE_KEY is missing in .env");
    return;
  }

  try {
    // 2. Provider Connection
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

    // 3. Wallet Check
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Wallet Address: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`Wallet Balance: ${balanceEth} ETH`);

    if (balance === 0n) {
      console.warn("⚠️ WARNING: Wallet has 0 ETH. Transactions will fail.");
    }

    // 4. Contract Check
    if (!contractAddress) {
        console.error("❌ ERROR: CONTRACT_ADDRESS is missing");
        return;
    }
    
    // Minimal ABI for verifySnapshot (view function)
    const ABI = ["function verifySnapshot(bytes32 hash) external view returns (bool)"];
    const contract = new ethers.Contract(contractAddress, ABI, provider); // Use provider for read-only

    const dummyHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    console.log(`Testing contract call verifySnapshot(${dummyHash})...`);
    
    const isVerified = await contract.verifySnapshot(dummyHash);
    console.log(`✅ Contract call successful. Result: ${isVerified}`);

  } catch (error: any) {
    console.error("❌ ERROR during blockchain interaction:");
    console.error(error.message);
    if (error.code) console.error(`Code: ${error.code}`);
  }
}

debugBlockchain();
