import axios from "axios";
import { GitHubService, GitHubRepo, GitHubRepoLanguages, GitHubCommit, GitHubPullRequest } from "./githubService";

export interface RepoAnalysis {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  languages: GitHubRepoLanguages;
  stars: number;
  forks: number;
  createdAt: string;
  pushedAt: string;
  topics: string[];
  commitCount: number;
  prCount: number;
  mergedPrCount: number;
  additions: number;
  deletions: number;
}

export interface DeveloperProfile {
  username: string;
  totalRepos: number;
  totalCommits: number;
  totalPRs: number;
  totalMergedPRs: number;
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
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.githubService = new GitHubService(accessToken);
    this.geminiApiKey = process.env.GEMINI_API_KEY || null;
  }

  async analyzeUser(username: string, monthsBack: number = 12): Promise<DeveloperProfile> {
    console.log(`[COMPREHENSIVE] Starting analysis for ${username}`);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    const since = startDate.toISOString();
    
    // Step 1: Fetch all repos
    const allRepos = await this.githubService.getUserRepos(username);
    console.log(`[COMPREHENSIVE] Found ${allRepos.length} total repos`);
    
    // Filter to owned, non-fork repos
    const ownedRepos = allRepos.filter(r => r.owner.login === username && !r.fork);
    console.log(`[COMPREHENSIVE] ${ownedRepos.length} owned non-fork repos`);
    
    // Step 2: Fetch detailed data for each repo
    const repoAnalyses: RepoAnalysis[] = [];
    let totalCommits = 0;
    let totalPRs = 0;
    let totalMergedPRs = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;
    
    // Process repos in batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < ownedRepos.length; i += batchSize) {
      const batch = ownedRepos.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(repo => this.analyzeRepoDetailed(repo, username, since))
      );
      
      for (const result of batchResults) {
        repoAnalyses.push(result);
        totalCommits += result.commitCount;
        totalPRs += result.prCount;
        totalMergedPRs += result.mergedPrCount;
        totalAdditions += result.additions;
        totalDeletions += result.deletions;
      }
      
      console.log(`[COMPREHENSIVE] Processed ${Math.min(i + batchSize, ownedRepos.length)}/${ownedRepos.length} repos`);
    }
    
    console.log(`[COMPREHENSIVE] Totals: ${totalCommits} commits, ${totalPRs} PRs (${totalMergedPRs} merged)`);
    
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
    
    const totalStars = repoAnalyses.reduce((sum, r) => sum + r.stars, 0);
    
    // Step 4: Calculate skill scores
    let skillScores: DeveloperProfile["skillScores"];
    let analysisMethod: "ai" | "heuristic";
    let confidence: number;
    
    if (this.geminiApiKey) {
      try {
        const aiResult = await this.analyzeWithAI(username, repoAnalyses, topLanguages, totalCommits, totalMergedPRs);
        skillScores = aiResult.scores;
        confidence = aiResult.confidence;
        analysisMethod = "ai";
        console.log(`[COMPREHENSIVE] AI analysis: ${JSON.stringify(skillScores)}`);
      } catch (error) {
        console.error(`[COMPREHENSIVE] AI failed, using heuristics:`, error);
        const result = this.analyzeWithHeuristics(repoAnalyses, topLanguages, totalCommits, totalMergedPRs);
        skillScores = result.scores;
        confidence = result.confidence;
        analysisMethod = "heuristic";
      }
    } else {
      console.log(`[COMPREHENSIVE] No AI key, using heuristics`);
      const result = this.analyzeWithHeuristics(repoAnalyses, topLanguages, totalCommits, totalMergedPRs);
      skillScores = result.scores;
      confidence = result.confidence;
      analysisMethod = "heuristic";
    }
    
    return {
      username,
      totalRepos: repoAnalyses.length,
      totalCommits,
      totalPRs,
      totalMergedPRs,
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

  private async analyzeRepoDetailed(repo: GitHubRepo, username: string, since: string): Promise<RepoAnalysis> {
    const [owner, repoName] = repo.full_name.split("/");
    
    try {
      // Fetch languages, commits, and PRs in parallel
      const [languages, commits, prs] = await Promise.all([
        this.githubService.getRepoLanguages(owner, repoName),
        this.fetchUserCommits(owner, repoName, username, since),
        this.fetchUserPRs(owner, repoName, username),
      ]);
      
      // Count additions/deletions from commits (sample first 20 for performance)
      let additions = 0;
      let deletions = 0;
      
      const commitsToAnalyze = commits.slice(0, 20);
      for (const commit of commitsToAnalyze) {
        if (commit.stats) {
          additions += commit.stats.additions || 0;
          deletions += commit.stats.deletions || 0;
        }
      }
      
      // Extrapolate if we sampled
      if (commits.length > 20) {
        const ratio = commits.length / 20;
        additions = Math.round(additions * ratio);
        deletions = Math.round(deletions * ratio);
      }
      
      const mergedPRs = prs.filter(pr => pr.merged);
      
      return {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        languages,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        createdAt: repo.created_at,
        pushedAt: repo.pushed_at,
        topics: (repo as any).topics || [],
        commitCount: commits.length,
        prCount: prs.length,
        mergedPrCount: mergedPRs.length,
        additions,
        deletions,
      };
    } catch (error) {
      console.error(`[COMPREHENSIVE] Error analyzing ${repo.full_name}:`, error);
      return {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        languages: {},
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        createdAt: repo.created_at,
        pushedAt: repo.pushed_at,
        topics: [],
        commitCount: 0,
        prCount: 0,
        mergedPrCount: 0,
        additions: 0,
        deletions: 0,
      };
    }
  }

  private async fetchUserCommits(owner: string, repo: string, username: string, since: string): Promise<GitHubCommit[]> {
    try {
      // Fetch commits authored by the user
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits`,
        {
          params: {
            author: username,
            since,
            per_page: 100,
          },
          headers: {
            Authorization: `token ${this.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch commits for ${owner}/${repo}`);
      return [];
    }
  }

  private async fetchUserPRs(owner: string, repo: string, username: string): Promise<GitHubPullRequest[]> {
    try {
      // Fetch PRs created by the user
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          params: {
            state: "all",
            per_page: 100,
          },
          headers: {
            Authorization: `token ${this.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      // Filter to user's PRs
      return response.data.filter((pr: any) => pr.user?.login === username);
    } catch (error) {
      console.error(`Failed to fetch PRs for ${owner}/${repo}`);
      return [];
    }
  }

  private async analyzeWithAI(
    username: string,
    repos: RepoAnalysis[],
    topLanguages: { language: string; percentage: number }[],
    totalCommits: number,
    totalMergedPRs: number
  ): Promise<{ scores: DeveloperProfile["skillScores"]; confidence: number }> {
    const repoSummaries = repos.slice(0, 15).map(r => ({
      name: r.name,
      description: r.description,
      language: r.language,
      languages: Object.keys(r.languages).slice(0, 5).join(", "),
      stars: r.stars,
      commits: r.commitCount,
      prs: r.prCount,
      mergedPRs: r.mergedPrCount,
    }));

    const prompt = `Analyze this developer's GitHub profile and score their skills (0-100).

Developer: ${username}
Total Repos: ${repos.length}
Total Commits: ${totalCommits}
Total PRs: ${repos.reduce((s, r) => s + r.prCount, 0)} (${totalMergedPRs} merged)
Code Volume: +${repos.reduce((s, r) => s + r.additions, 0).toLocaleString()} / -${repos.reduce((s, r) => s + r.deletions, 0).toLocaleString()} lines
Stars Earned: ${repos.reduce((s, r) => s + r.stars, 0)}
Top Languages: ${topLanguages.map(l => `${l.language} (${l.percentage}%)`).join(", ")}

Key Repositories:
${JSON.stringify(repoSummaries, null, 2)}

Score these skills based on the evidence:
1. Backend Engineering (Python, Java, Go, Rust, Node.js, APIs, databases, servers)
2. Frontend Engineering (JavaScript, TypeScript, React, Vue, Angular, CSS, UI)
3. DevOps/Infrastructure (Docker, Kubernetes, CI/CD, AWS/GCP, Terraform, Shell)
4. Systems/Architecture (C, C++, Rust, low-level, compilers, performance)

Consider:
- Language expertise depth (not just presence)
- Project complexity and real-world utility
- Activity level (commits, PRs)
- Community validation (stars)

RESPOND WITH ONLY JSON, NO MARKDOWN:
{"backend": <0-100>, "frontend": <0-100>, "devops": <0-100>, "systems": <0-100>, "confidence": <0-100>, "reasoning": "<30 words max>"}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);
    console.log(`[AI] ${result.reasoning}`);

    return {
      scores: {
        backend: Math.min(100, Math.max(0, result.backend || 0)),
        frontend: Math.min(100, Math.max(0, result.frontend || 0)),
        devops: Math.min(100, Math.max(0, result.devops || 0)),
        systems: Math.min(100, Math.max(0, result.systems || 0)),
        overall: Math.round((result.backend + result.frontend + result.devops + result.systems) / 4),
      },
      confidence: Math.min(100, Math.max(0, result.confidence || 70)),
    };
  }

  private analyzeWithHeuristics(
    repos: RepoAnalysis[],
    topLanguages: { language: string; bytes: number; percentage: number }[],
    totalCommits: number,
    totalMergedPRs: number
  ): { scores: DeveloperProfile["skillScores"]; confidence: number } {
    const backendLangs = ["Python", "Java", "Go", "Rust", "Ruby", "PHP", "C#", "Kotlin", "Scala"];
    const frontendLangs = ["JavaScript", "TypeScript", "HTML", "CSS", "Vue", "Svelte", "SCSS"];
    const devopsLangs = ["Shell", "Dockerfile", "HCL", "Makefile", "PowerShell"];
    const systemsLangs = ["C", "C++", "Rust", "Assembly", "Zig"];

    let backendScore = 0;
    let frontendScore = 0;
    let devopsScore = 0;
    let systemsScore = 0;

    // Score based on language percentages (max 60 points from languages)
    for (const { language, percentage } of topLanguages) {
      const langScore = Math.min(percentage * 0.8, 30); // Cap per language
      if (backendLangs.includes(language)) backendScore += langScore;
      if (frontendLangs.includes(language)) frontendScore += langScore;
      if (devopsLangs.includes(language)) devopsScore += langScore;
      if (systemsLangs.includes(language)) systemsScore += langScore;
    }

    // Boost based on repo characteristics (max 30 points)
    for (const repo of repos) {
      const name = repo.name.toLowerCase();
      const desc = (repo.description || "").toLowerCase();
      const boost = 3 + Math.min(5, repo.stars);

      if (name.includes("api") || name.includes("backend") || name.includes("server") ||
          desc.includes("rest") || desc.includes("graphql") || desc.includes("database")) {
        backendScore += boost;
      }
      if (name.includes("frontend") || name.includes("ui") || name.includes("web") || name.includes("app") ||
          desc.includes("react") || desc.includes("vue") || desc.includes("angular") || desc.includes("nextjs")) {
        frontendScore += boost;
      }
      if (name.includes("deploy") || name.includes("docker") || name.includes("k8s") || name.includes("infra") ||
          name.includes("terraform") || name.includes("ci") || desc.includes("pipeline") || desc.includes("devops")) {
        devopsScore += boost;
      }
      if (name.includes("kernel") || name.includes("driver") || name.includes("compiler") ||
          desc.includes("low-level") || desc.includes("performance") || desc.includes("embedded")) {
        systemsScore += boost;
      }
    }

    // Activity multiplier (commits and PRs boost confidence and scores)
    const activityBoost = Math.min(20, totalCommits / 10 + totalMergedPRs * 2);
    backendScore += activityBoost * 0.3;
    frontendScore += activityBoost * 0.3;
    devopsScore += activityBoost * 0.2;
    systemsScore += activityBoost * 0.1;

    // Normalize to 0-100
    const normalize = (score: number) => Math.min(100, Math.max(0, Math.round(score)));

    const scores = {
      backend: normalize(backendScore),
      frontend: normalize(frontendScore),
      devops: normalize(devopsScore),
      systems: normalize(systemsScore),
      overall: 0,
    };
    scores.overall = Math.round((scores.backend + scores.frontend + scores.devops + scores.systems) / 4);

    // Confidence based on data richness
    const confidence = Math.min(90, 40 + repos.length * 2 + Math.min(20, totalCommits / 5) + totalMergedPRs * 2);

    console.log(`[HEURISTIC] Scores: backend=${scores.backend}, frontend=${scores.frontend}, devops=${scores.devops}, systems=${scores.systems}`);
    return { scores, confidence };
  }
}
