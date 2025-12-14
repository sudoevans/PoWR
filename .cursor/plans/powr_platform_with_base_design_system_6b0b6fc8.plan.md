---
name: PoWR Platform with Base Design System
overview: Build a full-stack proof-of-work reputation platform with Base (Coinbase L2) design aesthetic, implementing GitHub OAuth, artifact analysis, PoW scoring, and on-chain proof anchoring on Base Sepolia.
todos:
  - id: setup-project
    content: Initialize Next.js project with TypeScript, Tailwind CSS, and project structure (frontend, backend, contracts, ai_logs)
    status: completed
  - id: design-system
    content: Implement Base design system tokens (colors, typography, shapes) in Tailwind config and create base UI components (Button, Card, TrustScoreCircle)
    status: completed
    dependencies:
      - setup-project
  - id: auth-flow
    content: Build GitHub OAuth authentication flow in frontend and backend, including session management
    status: completed
    dependencies:
      - setup-project
  - id: artifact-ingestion
    content: Implement GitHub API integration for artifact collection (repos, PRs, commits) with time window filtering
    status: completed
    dependencies:
      - auth-flow
  - id: ai-analysis
    content: Create AI analysis service for skill extraction with prompt templates stored in ai_logs/
    status: completed
    dependencies:
      - artifact-ingestion
  - id: scoring-engine
    content: Implement PoW scoring engine with skill-specific formulas and anti-gaming measures
    status: completed
    dependencies:
      - ai-analysis
  - id: builder-dashboard
    content: Build builder dashboard UI with PoW Index Card, Skill Percentile Panel, Artifacts Summary, Recent Work Feed, and On-Chain Proofs sections
    status: completed
    dependencies:
      - design-system
      - scoring-engine
  - id: smart-contracts
    content: Develop and deploy PoWRegistry smart contract to Base Sepolia for snapshot anchoring
    status: completed
    dependencies:
      - setup-project
  - id: blockchain-integration
    content: Integrate Web3 (wagmi/viem) in frontend for Base Sepolia, connect to deployed contract, implement transaction handling
    status: completed
    dependencies:
      - smart-contracts
      - builder-dashboard
  - id: recruiter-dashboard
    content: Build recruiter dashboard with candidate discovery, filtering, candidate cards, and comparison mode
    status: completed
    dependencies:
      - builder-dashboard
  - id: public-profile
    content: Create shareable public profile page (no auth required) displaying PoW skills, artifacts, and on-chain verification
    status: completed
    dependencies:
      - builder-dashboard
  - id: polish-testing
    content: Add responsive design, loading states, error handling, and complete README with deployment instructions
    status: completed
    dependencies:
      - recruiter-dashboard
      - public-profile
---

# PoWR Platform Implementation Plan

## Project Structure

```
PoWR/
├── frontend/          # Next.js 14+ with TypeScript
├── backend/          # Node.js/Express API
├── contracts/         # Solidity smart contracts for Base Sepolia
├── ai_logs/          # Vibe Coding compliance logs
└── README.md
```

## Phase 1: Project Foundation & Design System

### 1.1 Initialize Next.js Project

- Setup Next.js 14+ with TypeScript in `frontend/`
- Configure Tailwind CSS with custom Base design tokens
- Install dependencies: `lucide-react`, `@radix-ui` (for accessible components)

### 1.2 Design System Implementation

Create `frontend/src/styles/design-system.ts` with Base aesthetic tokens:

- Colors: `bg-primary: #0A0B0D`, `card-bg: #141519`, `primary-blue: #0052FF`
- Typography: Inter font family, tracking-tight for headings
- Shape tokens: `rounded-full` (buttons), `rounded-lg` (cards)
- Component variants following Base flat, snappy interaction style

### 1.3 Global Styles & Layout

- `frontend/src/app/layout.tsx` - Root layout with Inter font
- `frontend/src/app/globals.css` - Tailwind config with Base colors
- Dark theme only (no light mode)

## Phase 2: Core UI Components

### 2.1 Base Components (`frontend/src/components/ui/`)

- **Button**: `rounded-full`, Base Blue primary, flat interactions
- **Card**: `rounded-lg`, solid `#141519` background, no glassmorphism
- **TrustScoreCircle**: White number in solid blue circle (key motif)
- **SkillBar**: Horizontal bars for skill percentiles
- **PercentileBadge**: Badge component for "Top X%" displays

### 2.2 Icon System

- Use `lucide-react` with solid fill variants where available
- Consistent icon sizing and spacing

## Phase 3: Builder Dashboard (User View)

### 3.1 Authentication Flow

- `frontend/src/app/auth/page.tsx` - GitHub OAuth login page
- `frontend/src/components/auth/GitHubButton.tsx` - OAuth trigger
- Wallet linking component (optional, for proof anchoring)

### 3.2 Dashboard Layout

- `frontend/src/app/dashboard/page.tsx` - Main builder dashboard
- Grid layout with Base design spacing

### 3.3 Dashboard Components (`frontend/src/components/dashboard/`)

**PoW Index Card** (`PowIndexCard.tsx`):

- Large Trust Score circle (white number in blue circle)
- Change indicator (up/down trend)
- Explanation tooltip

**Skill Percentile Panel** (`SkillPercentilePanel.tsx`):

- Skill bars for: Backend, Frontend, DevOps/Infra, Systems/Architecture
- Each shows: PoW score (0-100), percentile ranking, confidence
- Visual bars with Base Blue accents

**Verified Artifacts Summary** (`ArtifactsSummary.tsx`):

- Stats cards: Repos analyzed, PRs merged, OSS projects
- Solid card backgrounds, circular icons

**Recent Verified Work Feed** (`RecentWorkFeed.tsx`):

- Activity feed with artifact links
- Timestamped entries
- Links to GitHub artifacts

**On-Chain Proofs Section** (`OnChainProofs.tsx`):

- Snapshot history table
- Transaction hash links (Base Sepolia explorer)
- Timestamp display

## Phase 4: Backend API

### 4.1 Backend Setup (`backend/`)

- Express.js with TypeScript
- Environment variables for GitHub OAuth, database, AI API keys
- CORS configuration for Next.js frontend

### 4.2 GitHub OAuth Integration

- `backend/src/routes/auth.ts` - OAuth callback handler
- Store GitHub tokens securely
- User session management

### 4.3 Artifact Ingestion Service

- `backend/src/services/githubService.ts` - GitHub API client
- `backend/src/services/artifactIngestion.ts` - Collect repos, PRs, commits
- Time window filtering (6-12 months default)
- Data normalization and storage

### 4.4 AI Analysis Engine

- `backend/src/services/aiAnalysis.ts` - Skill extraction service
- Integration with OpenAI/Anthropic API
- Prompt templates stored in `ai_logs/`
- Store analyzed signals per user

### 4.5 PoW Scoring Engine

- `backend/src/services/scoringEngine.ts` - Calculate skill-specific PoW scores
- Formula implementation (Impact × 0.4 + Complexity × 0.25 + Collaboration × 0.2 + Consistency × 0.15)
- Anti-gaming measures (diminishing returns, normalization)
- Percentile calculation

### 4.6 API Routes

- `GET /api/user/profile` - User PoW profile
- `GET /api/user/skills` - Skill scores and percentiles
- `GET /api/user/artifacts` - Verified artifacts list
- `POST /api/analyze` - Trigger artifact analysis
- `GET /api/proofs` - On-chain proof history

## Phase 5: Smart Contracts (Base Sepolia)

### 5.1 Contract Setup (`contracts/`)

- Hardhat or Foundry setup for Base Sepolia
- Environment configuration

### 5.2 PoW Snapshot Contract

- `contracts/PoWRegistry.sol` - Main registry contract
- Functions:
  - `anchorSnapshot(bytes32 artifactHash, uint256[] skillScores, address githubIdentity)`
  - `getSnapshot(address user) returns (Snapshot)`
  - `verifySnapshot(bytes32 hash) returns (bool)`
- Events for snapshot creation
- Minimal gas optimization

### 5.3 Deployment Scripts

- Deploy to Base Sepolia testnet
- Contract verification
- Address configuration for frontend

## Phase 6: Frontend-Backend Integration

### 6.1 API Client

- `frontend/src/lib/api.ts` - API client with fetch/axios
- Type-safe request/response types
- Error handling

### 6.2 Data Fetching

- React Server Components or SWR/React Query for data fetching
- Loading states with Base design
- Error boundaries

### 6.3 Blockchain Integration

- `frontend/src/lib/web3.ts` - Web3 connection (wagmi/viem)
- Base Sepolia network configuration
- Contract interaction hooks
- Transaction status handling

## Phase 7: Recruiter Dashboard

### 7.1 Candidate Discovery

- `frontend/src/app/recruiters/page.tsx` - Recruiter dashboard
- Search and filter UI (Base design)
- Skill-based filtering
- Percentile range filters

### 7.2 Candidate Cards

- `frontend/src/components/recruiter/CandidateCard.tsx`
- Skill PoW bars visualization
- Percentile badges
- Verification freshness indicator
- Links to public profiles

### 7.3 Comparison Mode

- `frontend/src/components/recruiter/ComparisonView.tsx`
- Side-by-side PoW profiles
- Evidence-backed evaluation UI

### 7.4 Public Profile Page

- `frontend/src/app/profile/[username]/page.tsx` - Shareable profile
- No login required
- Displays PoW skills, artifacts, on-chain verification
- Base design aesthetic

## Phase 8: Vibe Coding Compliance

### 8.1 AI Logs Structure (`ai_logs/`)

- `artifact_analysis_prompts.md` - AI prompts for artifact analysis
- `skill_extraction_prompts.md` - Skill classification prompts
- `scoring_iterations.md` - Scoring formula iterations and rationale

## Phase 9: Polish & Testing

### 9.1 Responsive Design

- Mobile-first approach
- Tablet and desktop breakpoints
- Base design maintained across sizes

### 9.2 Loading States

- Skeleton loaders with Base colors
- Snappy transitions (no glows)

### 9.3 Error Handling

- Error pages with Base design
- User-friendly error messages

### 9.4 Documentation

- `README.md` - Setup and deployment instructions
- Environment variable documentation
- API documentation

## Key Design System Rules (Enforced Throughout)

1. **Colors**: Background `#0A0B0D`, Cards `#141519`, Primary `#0052FF`
2. **Shapes**: `rounded-full` buttons, `rounded-lg` cards
3. **Surfaces**: Solid colors only, NO glassmorphism/blurs
4. **Typography**: Inter font, `tracking-tight` headings, bold weights
5. **Motifs**: Circles frequently, Trust Score = white number in blue circle
6. **Behavior**: Flat, snappy interactions, no neon glows
7. **Icons**: `lucide-react` with solid fills where possible

## Technical Stack Summary

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, lucide-react
- **Backend**: Node.js, Express, TypeScript
- **Blockchain**: Solidity, Hardhat/Foundry, Base Sepolia
- **Database**: (TBD - PostgreSQL recommended)
- **AI**: OpenAI/Anthropic API for skill extraction
- **Auth**: GitHub OAuth, optional wallet linking (wagmi/viem)