
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

// The correct configuration provided by the user
const correctConfig = `
PORT=3001
FRONTEND_URL=http://localhost:3000

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

# AI
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security
JWT_SECRET=your_jwt_secret_key

# Blockchain
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BLOCKCHAIN_PRIVATE_KEY=0x0668912dafefb390179b987456eb29172777ff9c56a3bcda467f7bc2cf90f6e8
CONTRACT_ADDRESS=0x8fb4fF2123E9a11fC027c494551794fc75e76980

# Database
DATABASE_URL="postgresql://neondb_owner:npg_LcTRX54jAQhd@ep-purple-waterfall-ad90lg8i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
`.trim();

console.log("Writing correct .env file...");
fs.writeFileSync(envPath, correctConfig);
console.log(".env file updated successfully!");
console.log("--- New Content ---");
console.log(correctConfig);
