import { Artifact } from "./artifactIngestion";
import { AIAnalysisService, SkillExtraction, ContributionImpact } from "./aiAnalysis";

export interface SkillPoWScore {
  skill: string;
  score: number;
  percentile: number;
  confidence: number;
  artifactCount: number;
}

export interface PoWProfile {
  skills: SkillPoWScore[];
  overallIndex: number;
  artifactSummary: {
    repos: number;
    commits: number;
    pullRequests: number;
    mergedPRs: number;
  };
  summary?: string;
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

    const skillCategories = [
      { key: "backend_engineering", name: "Backend Engineering" },
      { key: "frontend_engineering", name: "Frontend Engineering" },
      { key: "devops_infrastructure", name: "DevOps / Infrastructure" },
      { key: "systems_architecture", name: "Systems / Architecture" },
    ];

    // Ensure aiExtraction has valid structure
    const safeExtraction = aiExtraction || {
      backend_engineering: { score: 0, confidence: 0, evidence: [] },
      frontend_engineering: { score: 0, confidence: 0, evidence: [] },
      devops_infrastructure: { score: 0, confidence: 0, evidence: [] },
      systems_architecture: { score: 0, confidence: 0, evidence: [] },
    };

    for (const category of skillCategories) {
      const aiScore = safeExtraction[category.key as keyof SkillExtraction] || { score: 0, confidence: 0, evidence: [] };

      const powScore = await this.calculateSkillPoW(
        category.key,
        artifacts,
        aiScore
      );

      skillScores.push({
        skill: category.name,
        score: powScore,
        percentile: this.calculatePercentile(powScore),
        confidence: aiScore?.confidence || 0,
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
    const relevantArtifacts = this.filterArtifactsBySkill(artifacts, skillKey);

    const impactScore = await this.calculateImpactScore(relevantArtifacts);
    const complexityScore = await this.calculateComplexityScore(relevantArtifacts);
    const collaborationScore = await this.calculateCollaborationScore(relevantArtifacts);
    const consistencyScore = await this.calculateConsistencyScore(relevantArtifacts);

    const powScore =
      impactScore * 0.4 +
      complexityScore * 0.25 +
      collaborationScore * 0.2 +
      consistencyScore * 0.15;

    // Safe access to confidence with fallback
    const confidence = aiScore?.confidence ?? 50;
    const confidenceMultiplier = confidence / 100;
    const adjustedScore = powScore * confidenceMultiplier + powScore * (1 - confidenceMultiplier) * 0.5;

    return Math.min(100, Math.max(0, Math.round(adjustedScore)));
  }

  private async calculateImpactScore(artifacts: Artifact[]): Promise<number> {
    const relevantArtifacts = artifacts.filter(a => a.type === "pull_request" || a.type === "commit");

    if (relevantArtifacts.length === 0) {
      return 0;
    }

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

    const allPRs = artifacts.filter((a) => a.type === "pull_request") as any[];
    const mergedPRs = allPRs.filter((pr: any) => pr.data.merged).length;
    const prAcceptanceRate = allPRs.length > 0 ? (mergedPRs / allPRs.length) * 100 : 0;

    const avgImpact = count > 0 ? totalImpact / count : 0;
    return Math.min(100, avgImpact * 0.7 + prAcceptanceRate * 0.3);
  }

  private async calculateComplexityScore(artifacts: Artifact[]): Promise<number> {
    const relevantArtifacts = artifacts.filter(a => a.type === "pull_request" || a.type === "commit");

    if (relevantArtifacts.length === 0) {
      return 0;
    }

    const impactMap = this.impactCache || new Map();

    let totalComplexity = 0;
    let count = 0;

    for (const artifact of relevantArtifacts) {
      const impact = impactMap.get(artifact.id);

      if (!impact || typeof impact.complexity_delta !== 'number') {
        continue;
      }

      totalComplexity += impact.complexity_delta;
      count++;

      if (impact.quality_indicators?.has_tests) {
        totalComplexity += 10;
      }
      if (impact.quality_indicators?.refactored) {
        totalComplexity += 5;
      }
    }

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

    const repos = artifacts.filter((a) => a.type === "repo") as any[];
    const multiAuthorRepos = repos.filter((repo: any) => repo.data.forks_count > 0).length;

    const prCollaboration = prs.length > 0 ? (reviewedPRs / prs.length) * 50 : 0;
    const mergeRate = prs.length > 0 ? (mergedPRs / prs.length) * 30 : 0;
    const ossParticipation = repos.length > 0 ? (multiAuthorRepos / repos.length) * 20 : 0;

    return Promise.resolve(Math.min(100, prCollaboration + mergeRate + ossParticipation));
  }

  private calculateConsistencyScore(artifacts: Artifact[]): Promise<number> {
    if (artifacts.length === 0) return Promise.resolve(0);

    const monthlyActivity: { [key: string]: number } = {};

    artifacts.forEach((artifact) => {
      const date = new Date(artifact.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    });

    const months = Object.keys(monthlyActivity);
    if (months.length === 0) return Promise.resolve(0);

    const avgActivity = artifacts.length / months.length;
    let variance = 0;

    months.forEach((month) => {
      const diff = monthlyActivity[month] - avgActivity;
      variance += diff * diff;
    });

    const stdDev = Math.sqrt(variance / months.length);
    const consistency = Math.max(0, 100 - (stdDev / avgActivity) * 50);

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
    return artifacts;
  }

  private countRelevantArtifacts(artifacts: Artifact[], skillKey: string): number {
    return artifacts.length;
  }

  private calculatePercentile(score: number): number {
    if (score >= 90) return 10;
    if (score >= 80) return 20;
    if (score >= 70) return 30;
    if (score >= 60) return 40;
    if (score >= 50) return 50;
    return 100 - score;
  }

  async generatePoWProfile(
    artifacts: Artifact[],
    aiExtraction: SkillExtraction
  ): Promise<PoWProfile> {
    const validatedArtifacts = this.validateArtifactOwnership(artifacts);

    const relevantArtifacts = validatedArtifacts.filter(a => a.type === "pull_request" || a.type === "commit");
    if (relevantArtifacts.length > 0) {
      this.impactCache = await this.aiService.analyzeContributionImpactBatch(relevantArtifacts);
    } else {
      this.impactCache = new Map();
    }

    const skillScores = await this.calculatePoWScores(validatedArtifacts, aiExtraction);

    this.impactCache = null;

    const overallIndex = skillScores.reduce((sum, skill) => sum + skill.score, 0) / skillScores.length;

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

  private validateArtifactOwnership(artifacts: Artifact[]): Artifact[] {
    console.log(`validateArtifactOwnership: Processing ${artifacts.length} artifacts`);

    // For fast ingestion mode, we only have repos - include all non-fork repos
    // The filtering was too aggressive and removing everything
    const validated: Artifact[] = [];

    artifacts.forEach((artifact) => {
      if (artifact.type === "repo") {
        const repo = artifact.data as any;

        // Skip forks (user didn't create them)
        if (repo.fork) {
          console.log(`Skipping fork: ${repo.full_name}`);
          return;
        }

        // Include all owned repos (not forks)
        console.log(`Including repo: ${repo.full_name}, language: ${repo.language}, languages_breakdown: ${JSON.stringify(repo.languages_breakdown || {})}`);
        validated.push(artifact);
        return;
      }

      // Include all commits and PRs
      validated.push(artifact);
    });

    console.log(`validateArtifactOwnership: Validated ${validated.length} artifacts`);
    return validated;
  }
}
