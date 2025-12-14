# Artifact Analysis Prompts

## Purpose
These prompts are used by the AI analysis engine to extract meaningful signals from GitHub artifacts (commits, PRs, repositories).

## Prompt 1: Skill Classification from Repository

```
Analyze the following GitHub repository and classify the primary technical skills demonstrated:

Repository: {repo_name}
Description: {description}
Languages: {languages}
Stars: {stars}
Forks: {forks}

Classify the repository into one or more of these skill categories:
- Backend Engineering
- Frontend Engineering
- DevOps / Infrastructure
- Systems / Architecture

For each category, provide:
1. Confidence level (0-100)
2. Evidence (specific files, patterns, or technologies that indicate this skill)
3. Complexity level (Low, Medium, High)

Return JSON format:
{
  "skills": [
    {
      "category": "Backend Engineering",
      "confidence": 85,
      "evidence": ["Express.js API routes", "Database migrations"],
      "complexity": "High"
    }
  ]
}
```

## Prompt 2: Contribution Impact Analysis

```
Analyze the following GitHub contribution and assess its impact:

Type: {type} (commit or pull_request)
Title: {title}
Description: {description}
Files Changed: {files_changed}
Additions: {additions}
Deletions: {deletions}

Assess:
1. Impact Score (0-100): How significant is this contribution?
2. Complexity Delta: How complex are the changes? (0-100)
3. Quality Indicators:
   - Test coverage
   - Code review feedback
   - Refactoring depth
   - Documentation

Return JSON:
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

## Prompt 3: Collaboration Signal Extraction

```
Analyze collaboration signals from the following GitHub activity:

Pull Requests Opened: {prs_opened}
Pull Requests Merged: {prs_merged}
Pull Requests Reviewed: {prs_reviewed}
Issues Created: {issues_created}
Issues Resolved: {issues_resolved}
Multi-author Projects: {multi_author_count}
Open Source Contributions: {oss_contributions}

Calculate:
1. Collaboration Score (0-100)
2. OSS Participation Level (Low, Medium, High)
3. Review Activity Score (0-100)

Return JSON:
{
  "collaboration_score": 82,
  "oss_participation": "High",
  "review_activity": 75
}
```

