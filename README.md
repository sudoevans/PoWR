# PoWR - Proof of Work Reputation System

A proof-of-work-based reputation and hiring signal platform that replaces resumes and interviews with verifiable, artifact-backed evidence of real work.

## Overview

PoWR analyzes a developer's GitHub activity, extracts skill-level proof using AI, anchors credibility snapshots on-chain, and exposes a hiring-ready dashboard for both builders and recruiters.

**Core Principle**: *Participation can be faked. Proof of work cannot.*

## Project Structure

```
PoWR/
├── frontend/          # Next.js 14+ with TypeScript
├── backend/          # Node.js/Express API
├── contracts/         # Solidity smart contracts for Base Sepolia
├── ai_logs/          # Vibe Coding compliance logs
└── README.md
```

## Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, lucide-react, wagmi/viem
- **Backend**: Node.js, Express, TypeScript
- **Blockchain**: Solidity, Hardhat, Base Sepolia
- **AI**: OpenAI/Anthropic API for skill extraction
- **Auth**: GitHub OAuth, optional wallet linking

## Design System

PoWR uses the Base (Coinbase L2) design aesthetic:

- **Colors**: Background `#0A0B0D`, Cards `#141519`, Primary `#0052FF`
- **Shapes**: `rounded-full` buttons, `rounded-lg` cards
- **Surfaces**: Solid colors only, NO glassmorphism/blurs
- **Typography**: Inter font, `tracking-tight` headings, bold weights
- **Motifs**: Circles frequently, Trust Score = white number in blue circle
- **Behavior**: Flat, snappy interactions, no neon glows

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- GitHub OAuth App credentials
- OpenAI or Anthropic API key
- Base Sepolia RPC URL (for blockchain features)
- Wallet with Base Sepolia testnet ETH (for on-chain proofs)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PoWR
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Install contract dependencies:
```bash
cd ../contracts
npm install
```

### Configuration

#### Frontend

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-contract-address>
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

#### Backend

Create `backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

OPENAI_API_KEY=your_openai_api_key
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key

JWT_SECRET=your_jwt_secret_key

BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

#### Contracts

Create `contracts/.env`:
```env
PRIVATE_KEY=your_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

### Running the Application

1. Start the backend:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Deploy contracts (optional, for on-chain features):
```bash
cd contracts
npm run compile
npm run deploy:base-sepolia
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features

### Builder Dashboard
- PoW Index Card with Trust Score
- Skill Percentile Panel
- Verified Artifacts Summary
- Recent Verified Work Feed
- On-Chain Proofs Section

### Recruiter Dashboard
- Candidate Discovery with Search & Filters
- Candidate Cards with Skill Visualization
- Side-by-Side Comparison Mode
- Public Profile Links

### Public Profiles
- Shareable profile URLs
- No login required
- Displays PoW skills, artifacts, and on-chain verification

## API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - OAuth callback

### User
- `GET /api/user/profile` - Get user PoW profile
- `GET /api/user/skills` - Get skill scores and percentiles
- `GET /api/user/artifacts` - Get verified artifacts list
- `POST /api/user/analyze` - Trigger artifact analysis
- `GET /api/user/proofs` - Get on-chain proof history

## Smart Contracts

### PoWRegistry

Main contract for anchoring PoW snapshots on Base Sepolia.

**Functions**:
- `anchorSnapshot(bytes32 artifactHash, uint256[] skillScores, address githubIdentity)` - Anchor a snapshot
- `getSnapshot(address user)` - Get user's latest snapshot
- `verifySnapshot(bytes32 hash)` - Verify if a hash has been anchored

## Development

### Project Structure

- `frontend/app/` - Next.js app directory
- `frontend/app/components/` - React components
- `backend/src/` - Express API source
- `backend/src/services/` - Business logic services
- `contracts/contracts/` - Solidity contracts
- `contracts/scripts/` - Deployment scripts
- `ai_logs/` - AI prompt templates and scoring iterations

### Design System

All UI components follow the Base design aesthetic. See `frontend/app/styles/design-system.ts` for tokens.

## License

MIT

## Contributing

This is a hackathon project. Contributions welcome!

## Acknowledgments

Built for the Seedify hackathon with Base design aesthetic inspiration.

