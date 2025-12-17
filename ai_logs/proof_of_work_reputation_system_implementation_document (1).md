# Proof‑of‑Work Reputation System (PoWR)

## 1. Overview

  **PoWR** is a proof‑of‑work–based reputation and hiring signal platform that replaces resumes and interviews with **verifiable, artifact‑backed evidence of real work**. It analyzes a developer’s GitHub activity, extracts skill‑level proof using AI, anchors credibility snapshots on‑chain, and exposes a hiring‑ready dashboard for both builders and recruiters.

Core principle:
> *Participation can be faked. Proof of work cannot.*

PoWR is **not** a learning platform, social network, or activity game. It is a **credibility layer**.

---

## 2. System Goals

- Provide **objective, artifact‑verified skill signals**
- Eliminate resume inflation and interview guesswork
- Make developer reputation **portable, verifiable, and timestamped**
- Offer recruiters **evidence‑first hiring tools**
- Use blockchain **only where it adds trust**

---

## 3. User Types

### 3.1 Builder / Developer
- Signs in with GitHub
- Generates Proof‑of‑Work profile
- Shares public PoWR link
- Controls verification cadence

### 3.2 Recruiter / Hiring Manager
- Searches and compares candidates
- Filters by verified skills
- Reviews artifact‑backed evidence
- Trusts on‑chain proofs

---

## 4. High‑Level Architecture

```
GitHub OAuth
      ↓
Artifact Ingestion Engine
      ↓
AI Analysis & Skill Extraction
      ↓
PoW Scoring Engine
      ↓
On‑Chain Proof Anchoring
      ↓
User & Recruiter Dashboards
```

---

## 5. Authentication & Identity

### 5.1 GitHub OAuth (Primary Identity)

- GitHub is the **source of truth**
- OAuth scopes:
  - Public repositories
  - Commits
  - Pull requests
  - Issues

No scraping. No self‑reported data.

### 5.2 Wallet Linking (Optional but Encouraged)

- Wallet used only for:
  - Proof anchoring
  - Identity ownership
- No funds required

---

## 6. Artifact Ingestion Layer

### 6.1 Data Collected

Artifacts are **immutable evidence**:

- Repositories contributed to
- Commit history
- Pull requests (opened, merged, rejected)
- Code diffs
- Issues & reviews
- Repo metadata (stars, forks, contributors)

### 6.2 Time Windows

- Default: last **6–12 months**
- Snapshot‑based (not real‑time streaming)

---

## 7. AI Analysis Engine

### 7.1 Responsibilities

AI is used for **interpretation**, not hallucination:

- Skill classification
- Contribution impact analysis
- Complexity change detection
- Collaboration signal extraction

### 7.2 Extracted Signals

#### Technical Skills
- Backend Engineering
- Frontend Engineering
- DevOps / Infra
- Systems / Architecture

#### Work Quality Signals
- PR acceptance rate
- Refactor depth
- Code complexity deltas
- Test presence

#### Collaboration Signals
- PR reviews
- Multi‑author projects
- OSS participation

All outputs are tied to **specific artifacts**.

---

## 8. Proof‑of‑Work Scoring System

### 8.1 Philosophy

- **No single global score**
- Skill‑specific PoW indices
- Evidence‑weighted, not activity‑weighted

### 8.2 Skill PoW Scores

Each skill receives:
- PoW score (0–100)
- Percentile ranking
- Confidence level
- Artifact count used

Example:
- Backend Engineering → 82 (Top 12%)
- OSS Collaboration → 91 (Top 4%)

### 8.3 Anti‑Gaming Measures

- No streaks
- No manual inputs
- Diminishing returns on trivial commits
- Weighting toward merged & reviewed work

---

## 9. On‑Chain Proof Anchoring

### 9.1 What Is Stored On‑Chain

- Hash of analyzed artifact set
- Skill PoW snapshot
- Timestamp
- Wallet ↔ GitHub identity link

### 9.2 What Is NOT Stored

- Code
- Personal data
- Repo contents

### 9.3 Purpose

- Tamper resistance
- Verifiable claims
- Portable reputation

---

## 10. User Dashboard (Builder View)

### 10.1 Core Sections

#### PoW Index Card
- Proof‑of‑Work Index
- Change over time
- Explanation tooltip

#### Skill Percentile Panel
- Skill‑specific percentiles
- Visual radar or bars

#### Verified Artifacts Summary
- Repos analyzed
- PRs merged
- OSS projects

#### Recent Verified Work
- Artifact‑linked activity feed

#### On‑Chain Proofs
- Snapshot history
- Transaction references

---

## 11. Recruiter Dashboard

### 11.1 Candidate Discovery

- Search by skill
- Filter by percentile
- Filter by OSS participation
- Filter by consistency

### 11.2 Candidate Cards

- Skill PoW bars
- Percentile badges
- Verification freshness

### 11.3 Comparison Mode

- Side‑by‑side PoW profiles
- Evidence‑backed evaluation

---

## 12. Public Shareable Profile

- URL‑based access
- No login required
- Displays:
  - PoW skills
  - Artifact evidence
  - On‑chain verification

Designed for hiring managers.

---

## 13. Transparency & Trust

### 13.1 Methodology Disclosure

- How skills are inferred
- What signals are used
- What is excluded

### 13.2 AI Auditability

- Stored prompts
- Versioned scoring logic
- Repeatable analysis

---

## 14. Vibe Coding Compliance

### 14.1 Required Repo Structure

```
/ai_logs/
  - artifact_analysis_prompts.md
  - skill_extraction_prompts.md
  - scoring_iterations.md

/contracts/
/frontend/
/backend/
```

### 14.2 Commit Hygiene

- Clear AI‑assisted commits
- Iteration evidence

---

## 15. Security & Privacy

- Read‑only GitHub access
- No private repo access by default
- User‑controlled verification
- Minimal on‑chain footprint

---

## 16. Monetization Strategy

- Free for developers
- Recruiter subscriptions
- Verified PoW badge issuance
- Hiring platform API access

---

## 17. Future Extensions (Out of Scope for MVP)

- Private repo verification
- Multi‑platform (GitLab, Bitbucket)
- DAO attestations
- Team‑level PoW profiles
- Continuous reputation streams

---

## 18. Positioning Statement

> **PoWR is a proof-of-work reputation layer that replaces resumes with verifiable evidence and replaces interviews with truth.**

---

## 19. Seedify 150-Word Project Description

PoWR is a proof-of-work reputation protocol for hiring that replaces resumes and interview guesswork with verifiable evidence of real work. Instead of self-reported skills, PoWR analyzes a developer’s actual GitHub artifacts—commits, pull requests, repositories, and open-source contributions—using AI to extract skill-specific proof-of-work signals. These signals are converted into transparent, non-gameable skill scores and percentile rankings, then cryptographically anchored on-chain as immutable credibility snapshots.

Developers get a hiring-ready profile that shows what they’ve truly built, what skills they excel at, and the scale of projects they’ve contributed to. Recruiters get evidence-backed hiring signals without endless interviews, tests, or resume filtering. Blockchain is used only where it adds trust: to make reputation tamper-proof, confirmation-based, and portable across platforms. PoWR is free for builders and monetized through recruiter access and verification services, creating a sustainable, revenue-aligned Web3 hiring primitive.

---

## 20. 48-Hour Hackathon Technical Task Breakdown

### Hour 0–4: Foundations
- Define skill categories (3–5 max)
- Set scoring signals and weights
- Setup repo, CI, and Vibe Coding logs

### Hour 4–12: Backend & Data
- GitHub OAuth integration
- Artifact ingestion (repos, PRs, commits)
- Basic artifact normalization

### Hour 12–20: AI Analysis
- Prompt-based skill extraction
- Contribution impact heuristics
- Store analyzed signals per user

### Hour 20–28: Frontend (User Dashboard)
- PoW Index card
- Skill percentile visualizations
- Verified artifacts summary

### Hour 28–34: Blockchain Integration
- Smart contract for PoW snapshot anchoring
- Hash generation + on-chain write
- Transaction display in UI

### Hour 34–40: Recruiter View
- Candidate card UI
- Skill-based filtering
- Public profile sharing

### Hour 40–48: Polish & Submission
- Demo video recording
- README + deployment instructions
- AI logs + commit cleanup

---

## 21. Dashboard Components (UI → Data Mapping)

### PoW Index Card
- Data: weighted skill scores
- Purpose: quick credibility snapshot

### Skill Percentile Panel
- Data: per-skill PoW score + percentile
- Purpose: hiring-relevant granularity

### Verified Artifacts Summary
- Data: repo count, PRs, OSS projects
- Purpose: evidence transparency

### Recent Verified Work Feed
- Data: artifact-linked events
- Purpose: proof freshness

### On-Chain Proofs Section
- Data: snapshot hash, timestamp, chain
- Purpose: trust & immutability

---

## 22. Proof-of-Work Scoring Formula (Non-Gameable)

### Core Principles
- Weight merged work over raw commits
- Reward complexity & impact, not volume
- Penalize trivial or repetitive actions

### Example Formula (Per Skill)

PoW_skill = (
  ImpactScore × 0.4 +
  ComplexityDelta × 0.25 +
  CollaborationScore × 0.2 +
  ConsistencyScore × 0.15
)

### Anti-Gaming Controls
- Diminishing returns on small commits
- Repo size & contributor normalization
- Time-decay on inactive periods

---

## 23. Demo Video Script (Minute-by-Minute)

### Minute 0–0:30 — Problem
- Resumes lie, interviews are inefficient

### Minute 0:30–1:30 — Solution
- Proof-of-work over self-reported skills

### Minute 1:30–2:30 — Live Demo (Builder)
- GitHub login
- Artifact scan
- Skill PoW dashboard generation

### Minute 2:30–3:30 — Blockchain Proof
- Snapshot creation
- On-chain transaction
- Verifiable proof view

### Minute 3:30–4:30 — Recruiter View
- Candidate filtering
- Skill comparison
- Evidence-backed hiring

### Minute 4:30–5:00 — Vision
- Portable reputation
- Fairer hiring
- Trust-first Web3 primitive

