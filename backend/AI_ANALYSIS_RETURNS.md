# AI Analysis Service - Return Types

This document explains what the AI Analysis service returns for different operations.

## 1. Skill Extraction (`extractSkills`)

**Returns:** `SkillExtraction` interface

```typescript
{
  backend_engineering: {
    score: number;        // 0-100, skill level
    confidence: number;   // 0-100, how confident the AI is
    evidence: [          // Array of artifacts that demonstrate this skill
      {
        type: "repository" | "commit" | "pull_request",
        id: string,
        name?: string,
        reason: string   // Why this artifact demonstrates the skill
      }
    ]
  },
  frontend_engineering: { /* same structure */ },
  devops_infrastructure: { /* same structure */ },
  systems_architecture: { /* same structure */ }
}
```

**Example:**
```json
{
  "backend_engineering": {
    "score": 85,
    "confidence": 90,
    "evidence": [
      {
        "type": "repository",
        "id": "12345",
        "name": "my-api-server",
        "reason": "Contains REST API implementation with authentication"
      }
    ]
  },
  "frontend_engineering": {
    "score": 72,
    "confidence": 85,
    "evidence": [...]
  }
}
```

## 2. Contribution Impact Analysis (`analyzeContributionImpact`)

**Returns:** `ContributionImpact` interface

```typescript
{
  impact_score: number;      // 0-100, how impactful this contribution is
  complexity_delta: number;  // 0-100, how complex this contribution is
  quality_indicators: {
    has_tests: boolean;      // Does this contribution include tests?
    reviewed: boolean;       // Was this contribution reviewed?
    refactored: boolean;     // Does this involve refactoring?
    documented: boolean;     // Is this contribution documented?
  }
}
```

**Example:**
```json
{
  "impact_score": 75,
  "complexity_delta": 60,
  "quality_indicators": {
    "has_tests": true,
    "reviewed": true,
    "refactored": false,
    "documented": true
  }
}
```

## How It Works

1. **Skill Extraction**: 
   - Analyzes ALL artifacts (repos, commits, PRs) for a user
   - Extracts skill signals across 4 categories
   - Returns scores with evidence

2. **Contribution Impact**:
   - Analyzes INDIVIDUAL artifacts (commits or PRs)
   - Used during scoring to evaluate each contribution
   - Currently sampled (max 50 artifacts) to avoid too many API calls

## AI Model Used

- **Default**: `gemini-2.0-flash` (fast and efficient)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Format**: OpenAI-compatible JSON responses

## Error Handling

If AI analysis fails:
- **Skill Extraction**: Returns all scores as 0 with empty evidence
- **Contribution Impact**: Returns default scores (50, 50) with all quality indicators as false

## Performance Notes

- Skill extraction runs once per profile generation
- Contribution impact runs for sampled artifacts (max 50) during scoring
- Total AI calls per profile: ~51 (1 skill extraction + 50 impact analyses)




