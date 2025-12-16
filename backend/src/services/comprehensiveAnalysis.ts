import axios from "axios";
import { GitHubService, GitHubRepo, GitHubRepoLanguages } from "./githubService";

export interface RepoAnalysis {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  languages: GitHubRepoLanguages;
  stars: number;
  forks: number;
  isOwner: boolean;
  isFork: boolean;
  createdAt: string;
  pushedAt: string;
  topics: string[];
  commitCount: number;
  additions: number;
  deletions: number;
}

export interface DeveloperProfile {
  username: string;
  totalRepos: number;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  totalStars: number;
  topLanguages: { language: string; bytes: number; percentage: number }[];
  repos: RepoAnalysis[];
  skillScores: {
    backend: number;
    frontend: number;
    devops: number;
    systems: number;
    overall: number;
  };
  confidence: number;
  analysisMethod: "ai" | "heuristic";
}

export class ComprehensiveAnalysisService {
  private githubService: GitHubService;
  private geminiApiKey: string | null;

  constructor(accessToken: string) {
    this.githubService = new GitHubService(accessToken);
    this.geminiApiKey = process.env.GEMINI_API_KEY || null;
  }

  async analyzeUser(username: string, monthsBack: number = 12): Promise<DeveloperProfile> {
    console.log(`[COMPREHENSIVE] Starting analysis for ${username}`);
    
    // Step 1: Fetch all repos
    const allRepos = await this.githubService.getUserRepos(username);
    console.log(`[COMPREHENSIVE] Found ${allRepos.length} repos`);
    
    // Filter to owned, non-fork repos
    const ownedRepos = allRepos.filter(r => r.owner.login === username && !r.fork);
    console.log(`[COMPREHENSIVE] ${ownedRepos.length} owned non-fork repos`);
    
    // Step 2: Fetch languages and contribution stats for each repo (in parallel batches)
    const repoAnalyses: RepoAnalysis[] = [];
    const batchSize = 5; // Process 5 repos at a time to avoid rate limits
    
    for (let i = 0; i < ownedRepos.length; i += batchSize) {
      const batch = ownedRepos.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(repo => this.analyzeRepo(repo, username))
      );
      repoAnalyses.push(...batchResults);
    }
    
    console.log(`[COMPREHENSIVE] Analyzed ${repoAnalyses.length} repos with languages`);
    
    // Step 3: Aggregate language statistics
    const languageBytes: { [key: string]: number } = {};
    let totalBytes = 0;
    
    for (const repo of repoAnalyses) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
        totalBytes += bytes;
      }
    }
    
    const topLanguages = Object.entries(languageBytes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
      }));
    
    console.log(`[COMPREHENSIVE] Top languages: ${topLanguages.map(l => `${l.language}(${l.percentage}%)`).join(', ')}`);
    
    // Step 4: Calculate totals
    const totalCommits = repoAnalyses.reduce((sum, r) => sum + r.commitCount, 0);
    const totalAdditions = repoAnalyses.reduce((sum, r) => sum + r.additions, 0);
    const totalDeletions = repoAnalyses.reduce((sum, r) => sum + r.deletions, 0);
    const totalStars = repoAnalyses.reduce((sum, r) => sum + r.stars, 0);
    
    // Step 5: Calculate skill scores using AI or heuristics
    let skillScores: DeveloperProfile["skillScores"];
    let analysisMethod: "ai" | "heuristic";
    let confidence: number;
    
    if (this.geminiApiKey) {
      try {
        const aiResult = await this.analyzeWithAI(username, repoAnalyses, topLanguages);
        skillScores = aiResult.scores;
        confidence = aiResult.confidence;
        analysisMethod = "ai";
        console.log(`[COMPREHENSIVE] AI analysis complete: ${JSON.stringify(skillScores)}`);
      } catch (error) {
        console.error(`[COMPREHENSIVE] AI analysis failed, falling back to heuristics:`, error);
        const heuristicResult = this.analyzeWithHeuristics(repoAnalyses, topLanguages, totalCommits);
        skillScores = heuristicResult.scores;
        confidence = heuristicResult.confidence;
        analysisMethod = "heuristic";
      }
    } else {
      console.log(`[COMPREHENSIVE] No AI API key, using heuristics`);
      const heuristicResult = this.analyzeWithHeuristics(repoAnalyses, topLanguages, totalCommits);
      skillScores = heuristicResult.scores;
      confidence = heuristicResult.confidence;
      analysisMethod = "heuristic";
    }
    
    return {
      username,
      totalRepos: repoAnalyses.length,
      totalCommits,
      totalAdditions,
      totalDeletions,
      totalStars,
      topLanguages,
      repos: repoAnalyses,
      skillScores,
      confidence,
      analysisMethod,
    };
  }

  private async analyzeRepo(repo: GitHubRepo, username: string): Promise<RepoAnalysis> {
    const [owner, repoName] = repo.full_name.split("/");
    
    // Fetch languages and contribution stats in parallel
    const [languages, contribStats] = await Promise.all([
      this.githubService.getRepoLanguages(owner, repoName),
      this.githubService.getRepoContributorStats(owner, repoName, username),
    ]);
    
    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      languages,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      isOwner: repo.owner.login === username,
      isFork: repo.fork,
      createdAt: repo.created_at,
      pushedAt: repo.pushed_at,
      topics: (repo as any).topics || [],
      commitCount: contribStats?.totalCommits || 0,
      additions: contribStats?.additions || 0,
      deletions: contribStats?.deletions || 0,
    };
  }

  private async analyzeWithAI(
    username: string,
    repos: RepoAnalysis[],
    topLanguages: { language: string; percentage: number }[]
  ): Promise<{ scores: DeveloperProfile["skillScores"]; confidence: number }> {
    const repoSummaries = repos.slice(0, 15).map(r => ({
      name: r.name,
      description: r.description,
      language: r.language,
      languages: Object.keys(r.languages).join(", "),
      stars: r.stars,
      commits: r.commitCount,
      additions: r.additions,
    }));

    const prompt = `Analyze this developer's GitHub profile and provide skill scores (0-100).

Developer: ${username}
Total Repos: ${repos.length}
Total Commits: ${repos.reduce((s, r) => s + r.commitCount, 0)}
Total Code Added: ${repos.reduce((s, r) => s + r.additions, 0)} lines
Top Languages: ${topLanguages.map(l => `${l.language} (${l.percentage}%)`).join(", ")}

Repository Details:
${JSON.stringify(repoSummaries, null, 2)}

Based on this data, provide scores for:
1. Backend Engineering (Python, Java, Go, Rust, Node.js, APIs, databases)
2. Frontend Engineering (JavaScript, TypeScript, React, Vue, CSS, UI/UX)
3. DevOps/Infrastructure (Docker, K8s, CI/CD, cloud, shell scripts)
4. Systems/Architecture (C, C++, Rust, low-level, performance, distributed)

Consider:
- Language distribution and expertise depth
- Project complexity (stars, commits, code volume)
- Breadth vs depth of skills
- Real-world applicability

RESPOND WITH ONLY THIS JSON FORMAT, NO OTHER TEXT:
{
  "backend": <0-100>,
  "frontend": <0-100>,
  "devops": <0-100>,
  "systems": <0-100>,
  "confidence": <0-100>,
  "reasoning": "<brief explanation>"
}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      },
      {
        headers: {
          "X-goog-api-key": this.geminiApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty AI response");

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const result = JSON.parse(jsonMatch[0]);
    console.log(`[AI] Reasoning: ${result.reasoning}`);

    return {
      scores: {
        backend: Math.min(100, Math.max(0, result.backend || 0)),
        frontend: Math.min(100, Math.max(0, result.frontend || 0)),
        devops: Math.min(100, Math.max(0, result.devops || 0)),
        systems: Math.min(100, Math.max(0, result.systems || 0)),
        overall: Math.round(
          (result.backend + result.frontend + result.devops + result.systems) / 4
        ),
      },
      confidence: Math.min(100, Math.max(0, result.confidence || 70)),
    };
  }

  private analyzeWithHeuristics(
    repos: RepoAnalysis[],
    topLanguages: { language: string; bytes: number; percentage: number }[],
    totalCommits: number
  ): { scores: DeveloperProfile["skillScores"]; confidence: number } {
    // Language to skill mapping
    const backendLangs = ["Python", "Java", "Go", "Rust", "Ruby", "PHP", "C#", "Kotlin", "Scala"];
    const frontendLangs = ["JavaScript", "TypeScript", "HTML", "CSS", "Vue", "Svelte"];
    const devopsLangs = ["Shell", "Dockerfile", "HCL", "Makefile", "YAML"];
    const systemsLangs = ["C", "C++", "Rust", "Assembly", "Zig"];

    // Calculate raw scores based on language percentage
    let backendScore = 0;
    let frontendScore = 0;
    let devopsScore = 0;
    let systemsScore = 0;

    for (const { language, percentage } of topLanguages) {
      if (backendLangs.includes(language)) backendScore += percentage;
      if (frontendLangs.includes(language)) frontendScore += percentage;
      if (devopsLangs.includes(language)) devopsScore += percentage;
      if (systemsLangs.includes(language)) systemsScore += percentage;
    }

    // Boost based on repo characteristics
    for (const repo of repos) {
      const name = repo.name.toLowerCase();
      const desc = (repo.description || "").toLowerCase();

      // Backend indicators
      if (name.includes("api") || name.includes("backend") || name.includes("server") ||
          desc.includes("rest") || desc.includes("graphql") || desc.includes("database")) {
        backendScore += 5;
      }

      // Frontend indicators
      if (name.includes("frontend") || name.includes("ui") || name.includes("web") ||
          desc.includes("react") || desc.includes("vue") || desc.includes("angular")) {
        frontendScore += 5;
      }

      // DevOps indicators
      if (name.includes("deploy") || name.includes("docker") || name.includes("k8s") ||
          name.includes("terraform") || name.includes("ci") || name.includes("cd") ||
          desc.includes("pipeline") || desc.includes("infrastructure")) {
        devopsScore += 5;
      }

      // Systems indicators
      if (name.includes("kernel") || name.includes("driver") || name.includes("embedded") ||
          desc.includes("low-level") || desc.includes("performance") || desc.includes("compiler")) {
        systemsScore += 5;
      }

      // Boost for stars (validation from community)
      const starBoost = Math.min(10, repo.stars * 0.5);
      if (repo.language) {
        if (backendLangs.includes(repo.language)) backendScore += starBoost;
        if (frontendLangs.includes(repo.language)) frontendScore += starBoost;
        if (devopsLangs.includes(repo.language)) devopsScore += starBoost;
        if (systemsLangs.includes(repo.language)) systemsScore += starBoost;
      }
    }

    // Activity multiplier (more commits = more confidence in skill)
    const activityMultiplier = Math.min(1.5, 1 + totalCommits / 500);

    // Normalize scores to 0-100
    const normalize = (score: number) => Math.min(100, Math.round(score * activityMultiplier));

    const scores = {
      backend: normalize(backendScore),
      frontend: normalize(frontendScore),
      devops: normalize(devopsScore),
      systems: normalize(systemsScore),
      overall: 0,
    };

    scores.overall = Math.round(
      (scores.backend + scores.frontend + scores.devops + scores.systems) / 4
    );

    // Confidence based on data quality
    const confidence = Math.min(85, 30 + repos.length * 3 + Math.min(30, totalCommits / 10));

    console.log(`[HEURISTIC] Scores: ${JSON.stringify(scores)}, confidence: ${confidence}`);

    return { scores, confidence };
  }
}
