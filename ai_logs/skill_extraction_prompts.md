# Skill Extraction Prompts

## Purpose
Prompts for extracting specific technical skills from developer artifacts.

## Prompt: Comprehensive Skill Extraction

```
You are analyzing a developer's GitHub activity to extract verifiable proof-of-work signals.

Developer: {username}
Time Period: {start_date} to {end_date}

Artifacts Summary:
- Repositories: {repo_count}
- Commits: {commit_count}
- Pull Requests: {pr_count}
- Languages Used: {languages}

For each of the following skill categories, provide:

1. Backend Engineering
   - Score (0-100)
   - Evidence: Specific repos, commits, or PRs
   - Confidence: How certain are you? (0-100)

2. Frontend Engineering
   - Score (0-100)
   - Evidence: Specific repos, commits, or PRs
   - Confidence: How certain are you? (0-100)

3. DevOps / Infrastructure
   - Score (0-100)
   - Evidence: Specific repos, commits, or PRs
   - Confidence: How certain are you? (0-100)

4. Systems / Architecture
   - Score (0-100)
   - Evidence: Specific repos, commits, or PRs
   - Confidence: How certain are you? (0-100)

Return JSON:
{
  "backend_engineering": {
    "score": 82,
    "confidence": 90,
    "evidence": [
      {
        "type": "repository",
        "name": "api-server",
        "reason": "Express.js REST API with PostgreSQL"
      },
      {
        "type": "pull_request",
        "id": 123,
        "reason": "Implemented authentication middleware"
      }
    ]
  },
  "frontend_engineering": {
    "score": 65,
    "confidence": 75,
    "evidence": [...]
  },
  "devops_infrastructure": {
    "score": 45,
    "confidence": 60,
    "evidence": [...]
  },
  "systems_architecture": {
    "score": 70,
    "confidence": 80,
    "evidence": [...]
  }
}
```

