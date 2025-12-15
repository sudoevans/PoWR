import { Artifact } from "./artifactIngestion";
import { AIAnalysisService, SkillExtraction, ContributionImpact } from "./aiAnalysis";

export interface SkillPoWScore {
  skill: string;
  score: number; // 0-100
  percentile: number; // 0-100 (where 100 = top 1%)
  confidence: number; // 0-100
  artifactCount: number;
}

export interface PoWProfile {
  skills: SkillPoWScore[];
  overallIndex: number; // Weighted average
  artifactSummary: {
    repos: number;
    commits: number;
    pullRequests: number;
    mergedPRs: number;
  };
}

export class ScoringEngine {
  private aiService: AIAnalysisService;
  private impactCache: Map<string, ContributionImpact> | null = null;

  constructor() {
    this.aiService = new AIAnalysisService();
    this.impactCache = null;
  }

  async calculatePoWScores(
    artifacts: Artifact[],
    aiExtraction: SkillExtraction
  ): Promise<SkillPoWScore[]> {
    const skillScores: SkillPoWScore[] = [];

    // Calculate score for each skill category
    const skillCategories = [
      { key: "backend_engineering", name: "Backend Engineering" },
      { key: "frontend_engineering", name: "Frontend Engineering" },
      { key: "devops_infrastructure", name: "DevOps / Infrastructure" },
      { key: "systems_architecture", name: "Systems / Architecture" },
    ];

    for (const category of skillCategories) {
      const aiScore = aiExtraction[category.key as keyof SkillExtraction] as any;
      
      // Calculate PoW score using the formula
      const powScore = await this.calculateSkillPoW(
        category.key,
        artifacts,
        aiScore
      );

      skillScores.push({
        skill: category.name,
        score: powScore,
        percentile: this.calculatePercentile(powScore), // Simplified - in production, compare against all users
        confidence: aiScore.confidence || 0,
        artifactCount: this.countRelevantArtifacts(artifacts, category.key),
      });
    }

    return skillScores;
  }

  private async calculateSkillPoW(
    skillKey: string,
    artifacts: Artifact[],
    aiScore: any
  ): Promise<number> {
    // Filter artifacts relevant to this skill
    const relevantArtifacts = this.filterArtifactsBySkill(artifacts, skillKey);

    // Calculate component scores
    const impactScore = await this.calculateImpactScore(relevantArtifacts);
    const complexityScore = await this.calculateComplexityScore(relevantArtifacts);
    const collaborationScore = await this.calculateCollaborationScore(relevantArtifacts);
    const consistencyScore = await this.calculateConsistencyScore(relevantArtifacts);

    // Apply formula: Impact × 0.4 + Complexity × 0.25 + Collaboration × 0.2 + Consistency × 0.15
    const powScore =
      impactScore * 0.4 +
      complexityScore * 0.25 +
      collaborationScore * 0.2 +
      consistencyScore * 0.15;

    // Apply AI confidence as a multiplier
    const confidenceMultiplier = (aiScore.confidence || 50) / 100;
    const adjustedScore = powScore * confidenceMultiplier + powScore * (1 - confidenceMultiplier) * 0.5;

    return Math.min(100, Math.max(0, Math.round(adjustedScore)));
  }

  private async calculateImpactScore(artifacts: Artifact[]): Promise<number> {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
    const relevantArtifacts = artifacts.filter(a => a.type === "pull_request" || a.type === "commit");
    fs.appendFileSync(logPath, JSON.stringify({location:'scoringEngine.ts:94',message:'calculateImpactScore start',data:{totalArtifacts:artifacts.length,relevantCount:relevantArtifacts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion

    if (relevantArtifacts.length === 0) {
      return 0;
    }

    // Use cached batch analysis results (computed once in calculatePoWScores)
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'scoringEngine.ts:100',message:'using cached batch analysis',data:{count:relevantArtifacts.length,hasCache:!!this.impactCache},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion
    const impactMap = this.impactCache || new Map();

    let totalImpact = 0;
    let count = 0;

    for (const artifact of relevantArtifacts) {
      const impact = impactMap.get(artifact.id);
      if (impact && typeof impact.impact_score === 'number') {
        totalImpact += impact.impact_score;
        count++;
      }
    }
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'scoringEngine.ts:115',message:'calculateImpactScore complete',data:{count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion

    // PR acceptance rate bonus
    const allPRs = artifacts.filter((a) => a.type === "pull_request") as any[];
    const mergedPRs = allPRs.filter((pr: any) => pr.data.merged).length;
    const prAcceptanceRate = allPRs.length > 0 ? (mergedPRs / allPRs.length) * 100 : 0;

    const avgImpact = count > 0 ? totalImpact / count : 0;
    return Math.min(100, avgImpact * 0.7 + prAcceptanceRate * 0.3);
  }

  private async calculateComplexityScore(artifacts: Artifact[]): Promise<number> {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
    const relevantArtifacts = artifacts.filter(a => a.type === "pull_request" || a.type === "commit");
    fs.appendFileSync(logPath, JSON.stringify({location:'scoringEngine.ts:115',message:'calculateComplexityScore start',data:{totalArtifacts:artifacts.length,relevantCount:relevantArtifacts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion

    if (relevantArtifacts.length === 0) {
      return 0;
    }

    // Use cached batch analysis results (computed once in calculatePoWScores)
    const impactMap = this.impactCache || new Map();

    let totalComplexity = 0;
    let count = 0;

    for (const artifact of relevantArtifacts) {
      const impact = impactMap.get(artifact.id);
      
      // Defensive check: ensure impact has required structure
      if (!impact || typeof impact.complexity_delta !== 'number') {
        continue;
      }
      
      totalComplexity += impact.complexity_delta;
      count++;

      // Test presence bonus (with defensive check)
      if (impact.quality_indicators?.has_tests) {
        totalComplexity += 10;
      }
      // Refactoring bonus (with defensive check)
      if (impact.quality_indicators?.refactored) {
        totalComplexity += 5;
      }
    }
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'scoringEngine.ts:140',message:'calculateComplexityScore complete',data:{count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion

    // Apply diminishing returns for small commits
    const allCommits = artifacts.filter((a) => a.type === "commit") as any[];
    const smallCommits = allCommits.filter((c: any) => {
      const stats = c.data.stats;
      if (!stats) return false;
      return stats.total < 50;
    }).length;

    const complexityPenalty = Math.min(20, smallCommits * 0.5);

    const avgComplexity = count > 0 ? totalComplexity / count : 0;
    return Math.min(100, Math.max(0, avgComplexity - complexityPenalty));
  }

  private calculateCollaborationScore(artifacts: Artifact[]): Promise<number> {
    const prs = artifacts.filter((a) => a.type === "pull_request") as any[];
    const mergedPRs = prs.filter((pr: any) => pr.data.merged).length;
    const reviewedPRs = prs.filter((pr: any) => pr.data.state === "closed").length;

    // Multi-author projects
    const repos = artifacts.filter((a) => a.type === "repo") as any[];
    const multiAuthorRepos = repos.filter((repo: any) => repo.data.forks_count > 0).length;

    const prCollaboration = prs.length > 0 ? (reviewedPRs / prs.length) * 50 : 0;
    const mergeRate = prs.length > 0 ? (mergedPRs / prs.length) * 30 : 0;
    const ossParticipation = repos.length > 0 ? (multiAuthorRepos / repos.length) * 20 : 0;

    return Promise.resolve(Math.min(100, prCollaboration + mergeRate + ossParticipation));
  }

  private calculateConsistencyScore(artifacts: Artifact[]): Promise<number> {
    if (artifacts.length === 0) return Promise.resolve(0);

    // Group artifacts by month
    const monthlyActivity: { [key: string]: number } = {};
    
    artifacts.forEach((artifact) => {
      const date = new Date(artifact.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    });

    const months = Object.keys(monthlyActivity);
    if (months.length === 0) return Promise.resolve(0);

    // Calculate activity distribution
    const avgActivity = artifacts.length / months.length;
    let variance = 0;

    months.forEach((month) => {
      const diff = monthlyActivity[month] - avgActivity;
      variance += diff * diff;
    });

    const stdDev = Math.sqrt(variance / months.length);
    const consistency = Math.max(0, 100 - (stdDev / avgActivity) * 50);

    // Time decay: reduce score for very old artifacts
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentArtifacts = artifacts.filter((a) => {
      const artifactDate = new Date(a.timestamp);
      return artifactDate >= sixMonthsAgo;
    }).length;

    const recencyFactor = artifacts.length > 0 ? recentArtifacts / artifacts.length : 0;

    return Promise.resolve(Math.min(100, consistency * recencyFactor));
  }

  private filterArtifactsBySkill(artifacts: Artifact[], skillKey: string): Artifact[] {
    // In a real implementation, this would use AI-extracted evidence
    // For now, return all artifacts (filtering would be based on AI evidence)
    return artifacts;
  }

  private countRelevantArtifacts(artifacts: Artifact[], skillKey: string): number {
    // Count artifacts that have evidence for this skill
    return artifacts.length; // Simplified
  }

  private calculatePercentile(score: number): number {
    // Simplified percentile calculation
    // In production, this would compare against all users in the database
    // For now, use a simple mapping
    if (score >= 90) return 10; // Top 10%
    if (score >= 80) return 20; // Top 20%
    if (score >= 70) return 30; // Top 30%
    if (score >= 60) return 40; // Top 40%
    if (score >= 50) return 50; // Top 50%
    return 100 - score; // Rough estimate
  }

  async generatePoWProfile(
    artifacts: Artifact[],
    aiExtraction: SkillExtraction
  ): Promise<PoWProfile> {
    // Validate and filter artifacts to ensure they represent actual user work
    const validatedArtifacts = this.validateArtifactOwnership(artifacts);
    
    // Pre-compute batch impact analysis for ALL validated artifacts once (before skill-specific filtering)
    const relevantArtifacts = validatedArtifacts.filter(a => a.type === "pull_request" || a.type === "commit");
    if (relevantArtifacts.length > 0) {
      this.impactCache = await this.aiService.analyzeContributionImpactBatch(relevantArtifacts);
    } else {
      this.impactCache = new Map();
    }

    const skillScores = await this.calculatePoWScores(validatedArtifacts, aiExtraction);
    
    // Clear cache after use
    this.impactCache = null;

    // Calculate overall index (weighted average)
    const overallIndex = skillScores.reduce((sum, skill) => sum + skill.score, 0) / skillScores.length;

    // Count validated artifacts only
    const repos = validatedArtifacts.filter((a) => a.type === "repo").length;
    const commits = validatedArtifacts.filter((a) => a.type === "commit").length;
    const pullRequests = validatedArtifacts.filter((a) => a.type === "pull_request").length;
    const mergedPRs = validatedArtifacts
      .filter((a) => a.type === "pull_request")
      .filter((a: any) => a.data.merged).length;

    return {
      skills: skillScores,
      overallIndex: Math.round(overallIndex),
      artifactSummary: {
        repos,
        commits,
        pullRequests,
        mergedPRs,
      },
    };
  }

  /**
   * Validate that artifacts represent actual user work
   * Filters out forks, collaborator repos, repos with no user commits, etc.
   */
  private validateArtifactOwnership(artifacts: Artifact[]): Artifact[] {
    const validated: Artifact[] = [];
    const reposWithContributions = new Set<string>();

    // First pass: identify repos that have actual user contributions
    artifacts.forEach((artifact) => {
      if (artifact.type === "commit" || artifact.type === "pull_request") {
        if (artifact.repository) {
          const repoKey = `${artifact.repository.owner}/${artifact.repository.name}`;
          reposWithContributions.add(repoKey);
        }
      }
    });

    // Second pass: only include artifacts that represent user-authored work
    artifacts.forEach((artifact) => {
      if (artifact.type === "repo") {
        const repo = artifact.data as any;
        const repoKey = repo.full_name;
        const [owner] = repoKey.split("/");
        
        // CRITICAL: Exclude all forks - user didn't author them
        if (repo.fork) {
          return; // Skip all forks
        }
        
        // CRITICAL: Only include repos where user is the owner
        // We can't check username here, but we trust the ingestion service filtered correctly
        // Still verify the repo has contributions
        if (!reposWithContributions.has(repoKey)) {
          return; // Skip repos without user contributions
        }
      }
      
      // Include commits and PRs (they've already been filtered by author)
      validated.push(artifact);
    });

    return validated;
  }
}

