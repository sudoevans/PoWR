# Blockchain Integration Setup

## Overview

PoWR anchors proof-of-work snapshots to Base Sepolia blockchain for tamper-proof reputation verification.

## What Gets Anchored On-Chain

According to the requirements, we store:
- **Artifact Hash**: Hash of the analyzed artifact set (repos, commits, PRs)
- **Skill Scores**: Array of skill-specific PoW scores (0-100)
- **Timestamp**: When the snapshot was created
- **GitHub Identity**: Optional wallet address linked to GitHub (can be zero address)

**We do NOT store:**
- Code content
- Personal data
- Repository contents
- Full artifact data

## Contract Details

- **Contract Address**: `0x8fb4fF2123E9a11fC027c494551794fc75e76980`
- **Network**: Base Sepolia (Testnet)
- **Chain ID**: 84532
- **Explorer**: https://sepolia.basescan.org

## Setup Instructions

### 1. Get Base Sepolia ETH

You need ETH on Base Sepolia to pay for gas:
- **Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **Alternative**: https://faucet.quicknode.com/base/sepolia

### 2. Create a Wallet (Optional)

For testing, you can use the deployer wallet. For production:
- Create a new wallet or use an existing one
- Fund it with Base Sepolia ETH
- Keep the private key secure

### 3. Configure Backend

Add to `backend/.env`:

```env
# Blockchain Configuration
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0x8fb4fF2123E9a11fC027c494551794fc75e76980
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

**Important**: 
- Never commit private keys to git
- Use a dedicated wallet for the backend (not your main wallet)
- Keep at least 0.01 ETH for gas fees

### 4. How It Works

1. **Profile Generation**: When a user's profile is generated:
   - Artifacts are analyzed
   - Skill scores are calculated
   - Artifact hash is generated (keccak256 of artifact set)
   - Transaction is sent to blockchain

2. **Automatic Anchoring**: 
   - Happens automatically after profile generation
   - Non-blocking (won't fail if blockchain is unavailable)
   - Transaction hash is stored in database

3. **Viewing Proofs**:
   - Users can see all their on-chain proofs in the dashboard
   - Each proof links to Basescan for verification
   - Shows transaction hash, block number, and skill scores

## Contract Functions

### `anchorSnapshot(bytes32 artifactHash, uint256[] skillScores, address githubIdentity)`
- Anchors a PoW snapshot on-chain
- Called automatically after profile generation
- Requires gas (paid by backend wallet)

### `getSnapshot(address user)`
- Returns the latest snapshot for a user address
- View function (no gas required)

### `verifySnapshot(bytes32 hash)`
- Verifies if a hash has been anchored
- View function (no gas required)

## Gas Costs

- **Estimated Cost**: ~0.0001 - 0.001 ETH per snapshot
- **Frequency**: Once per profile generation (or when user refreshes)
- **Optimization**: Only anchors when profile is actually updated

## Testing

### Test Blockchain Anchoring

1. Ensure you have Base Sepolia ETH in your wallet
2. Set `BLOCKCHAIN_PRIVATE_KEY` in `backend/.env`
3. Generate a profile (login → dashboard → refresh analysis)
4. Check the dashboard for "On-Chain Proofs" section
5. Click "View on BaseScan" to see the transaction

### Verify on Basescan

1. Go to https://sepolia.basescan.org
2. Search for your transaction hash
3. Verify the data matches your profile

## Production Considerations

1. **Wallet Security**:
   - Use a hardware wallet or secure key management
   - Rotate keys periodically
   - Monitor wallet balance

2. **Gas Optimization**:
   - Consider batching multiple snapshots
   - Use gas price oracles
   - Implement retry logic for failed transactions

3. **Error Handling**:
   - Blockchain failures shouldn't break profile generation
   - Log all blockchain operations
   - Provide user feedback on anchoring status

4. **Cost Management**:
   - Monitor gas costs
   - Set daily/weekly limits
   - Consider L2 solutions for lower costs

## Troubleshooting

### "Blockchain service not configured"
- Check that `BLOCKCHAIN_PRIVATE_KEY` is set in `.env`
- Restart the backend server

### "Insufficient funds"
- Add more Base Sepolia ETH to your wallet
- Check balance: https://sepolia.basescan.org/address/YOUR_ADDRESS

### "Transaction failed"
- Check gas price (may be too low)
- Verify contract address is correct
- Check RPC URL is accessible

### "No proofs showing"
- Verify transaction was successful on Basescan
- Check database for stored proofs
- Ensure profile was generated after blockchain setup

## Next Steps

1. ✅ Contract deployed
2. ✅ Blockchain service created
3. ✅ Database integration
4. ✅ Automatic anchoring on profile generation
5. ✅ Frontend display of proofs

The system is ready to anchor PoW snapshots to the blockchain!



