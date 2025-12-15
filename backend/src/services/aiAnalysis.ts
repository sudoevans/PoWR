import axios from "axios";
import { Artifact } from "./artifactIngestion";

export interface SkillExtraction {
  backend_engineering: SkillScore;
  frontend_engineering: SkillScore;
  devops_infrastructure: SkillScore;
  systems_architecture: SkillScore;
}

export interface SkillScore {
  score: number; // 0-100
  confidence: number; // 0-100
  evidence: Evidence[];
}

export interface Evidence {
  type: "repository" | "commit" | "pull_request";
  id: string;
  name?: string;
  reason: string;
}

export interface ContributionImpact {
  impact_score: number; // 0-100
  complexity_delta: number; // 0-100
  quality_indicators: {
    has_tests: boolean;
    reviewed: boolean;
    refactored: boolean;
    documented: boolean;
  };
}

export interface CollaborationSignals {
  collaboration_score: number; // 0-100
  oss_participation: "Low" | "Medium" | "High";
  review_activity: number; // 0-100
}

export class AIAnalysisService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private provider: "gemini" | "openai" | "anthropic" | "agent_router";

  constructor() {
    // Prioritize Gemini API (Google's Generative AI)
    if (process.env.GEMINI_API_KEY) {
      this.provider = "gemini";
      this.apiKey = process.env.GEMINI_API_KEY;
      this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    } else if (process.env.AGENT_ROUTER_API_KEY) {
      this.provider = "agent_router";
      this.apiKey = process.env.AGENT_ROUTER_API_KEY;
      this.apiUrl = "https://agentrouter.org/v1/chat/completions";
      this.model = process.env.AGENT_ROUTER_MODEL || "claude-haiku-4-5-20251001";
    } else if (process.env.OPENAI_API_KEY) {
      this.provider = "openai";
      this.apiKey = process.env.OPENAI_API_KEY;
      this.apiUrl = "https://api.openai.com/v1/chat/completions";
      this.model = "gpt-4";
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.provider = "anthropic";
      this.apiKey = process.env.ANTHROPIC_API_KEY;
      this.apiUrl = "https://api.anthropic.com/v1/messages";
      this.model = "claude-3-opus-20240229";
    } else {
      this.provider = "gemini";
      this.apiKey = "";
      this.model = "gemini-3-pro-preview";
      this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    }
  }

  async extractSkills(
    username: string,
    artifacts: Artifact[],
    timeWindow: { start: string; end: string }
  ): Promise<SkillExtraction> {
    // Prepare artifact summary
    const repoCount = artifacts.filter((a) => a.type === "repo").length;
    const commitCount = artifacts.filter((a) => a.type === "commit").length;
    const prCount = artifacts.filter((a) => a.type === "pull_request").length;

    const languages = new Set<string>();
    artifacts.forEach((artifact) => {
      if (artifact.type === "repo") {
        const repo = artifact.data as any;
        if (repo.language) {
          languages.add(repo.language);
        }
      }
    });

    // Load prompt template
    const prompt = this.buildSkillExtractionPrompt(
      username,
      repoCount,
      commitCount,
      prCount,
      Array.from(languages),
      timeWindow
    );

    try {
      const response = await this.callAI(prompt);
      return this.parseSkillExtraction(response);
    } catch (error) {
      console.error("AI analysis error:", error);
      // Return default scores on error
      return this.getDefaultSkillExtraction();
    }
  }

  async analyzeContributionImpact(artifact: Artifact): Promise<ContributionImpact> {
    const prompt = this.buildImpactAnalysisPrompt(artifact);
    
    try {
      const response = await this.callAI(prompt);
      return this.parseImpactAnalysis(response);
    } catch (error) {
      console.error("Impact analysis error:", error);
      return {
        impact_score: 50,
        complexity_delta: 50,
        quality_indicators: {
          has_tests: false,
          reviewed: false,
          refactored: false,
          documented: false,
        },
      };
    }
  }

  /**
   * Batch analyze multiple artifacts using Gemini's large context window (1M tokens)
   * This is much more efficient than individual API calls
   */
  async analyzeContributionImpactBatch(artifacts: Artifact[]): Promise<Map<string, ContributionImpact>> {
    if (artifacts.length === 0) {
      return new Map();
    }

    // Only use batch processing for Gemini (has large context window)
    if (this.provider !== "gemini") {
      // Fallback to individual calls for other providers
      const results = new Map<string, ContributionImpact>();
      for (const artifact of artifacts) {
        const impact = await this.analyzeContributionImpact(artifact);
        results.set(artifact.id, impact);
      }
      return results;
    }

    // Build comprehensive prompt for all artifacts
    const artifactsSummary = artifacts.map((artifact, index) => {
      let details = "";
      if (artifact.type === "pull_request") {
        const pr = artifact.data as any;
        details = `[${index}] PR: ${pr.title || "N/A"} | Author: ${pr.user?.login || "N/A"} | State: ${pr.state} | Merged: ${pr.merged} | Additions: ${pr.additions || 0} | Deletions: ${pr.deletions || 0}`;
      } else if (artifact.type === "commit") {
        const commit = artifact.data as any;
        details = `[${index}] Commit: ${commit.commit?.message?.substring(0, 200) || "N/A"} | Author: ${commit.author?.login || commit.commit?.author?.name || "N/A"} | SHA: ${commit.sha}`;
      }
      return details;
    }).join("\n");

    const prompt = `Analyze the impact and complexity of these ${artifacts.length} contributions. For each artifact, provide:
- impact_score (0-100): How significant is this contribution? Consider code changes, not just repository updates
- complexity_delta (0-100): How complex are the actual changes made?
- quality_indicators (has_tests, reviewed, refactored, documented as booleans)

CRITICAL FILTERING RULES:
1. If an artifact represents a fork with no user changes (e.g., just forking a repo), set impact_score to 0
2. If an artifact shows updates made by others (not the user), set impact_score to 0
3. Only score artifacts where the user actually authored the changes
4. For repositories, only give high scores if the user has made substantial contributions

IMPORTANT: Respond with ONLY a valid JSON array, no markdown code blocks, no explanations, no additional text. Just the JSON array.

Return a JSON array where each element corresponds to the artifact at that index:
[
  {"impact_score": 75, "complexity_delta": 60, "quality_indicators": {"has_tests": true, "reviewed": true, "refactored": false, "documented": true}},
  ...
]

Artifacts:
${artifactsSummary}`;

    try {
      const response = await this.callAI(prompt);
      const cleanedResponse = this.extractJSON(response);
      const results = JSON.parse(cleanedResponse);
      
      const impactMap = new Map<string, ContributionImpact>();
      artifacts.forEach((artifact, index) => {
        const result = Array.isArray(results) ? results[index] : results;
        const impact: ContributionImpact = {
          impact_score: typeof result?.impact_score === 'number' ? result.impact_score : 50,
          complexity_delta: typeof result?.complexity_delta === 'number' ? result.complexity_delta : 50,
          quality_indicators: {
            has_tests: result?.quality_indicators?.has_tests === true,
            reviewed: result?.quality_indicators?.reviewed === true,
            refactored: result?.quality_indicators?.refactored === true,
            documented: result?.quality_indicators?.documented === true,
          },
        };
        impactMap.set(artifact.id, impact);
      });
      
      return impactMap;
    } catch (error) {
      console.error("Batch impact analysis error:", error);
      // Return defaults for all artifacts
      const impactMap = new Map<string, ContributionImpact>();
      artifacts.forEach((artifact) => {
        impactMap.set(artifact.id, {
          impact_score: 50,
          complexity_delta: 50,
          quality_indicators: {
            has_tests: false,
            reviewed: false,
            refactored: false,
            documented: false,
          },
        });
      });
      return impactMap;
    }
  }

  /**
   * Extract JSON from response, handling markdown code blocks
   */
  private extractJSON(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    
    // Remove ```json or ``` at start
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7).trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3).trim();
    }
    
    // Remove ``` at end
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3).trim();
    }
    
    // Find JSON array or object boundaries
    const jsonStart = cleaned.indexOf('[');
    const jsonObjectStart = cleaned.indexOf('{');
    
    if (jsonStart !== -1) {
      // Find matching closing bracket
      let depth = 0;
      let jsonEnd = jsonStart;
      for (let i = jsonStart; i < cleaned.length; i++) {
        if (cleaned[i] === '[') depth++;
        if (cleaned[i] === ']') depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    } else if (jsonObjectStart !== -1) {
      // Find matching closing brace
      let depth = 0;
      let jsonEnd = jsonObjectStart;
      for (let i = jsonObjectStart; i < cleaned.length; i++) {
        if (cleaned[i] === '{') depth++;
        if (cleaned[i] === '}') depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
      cleaned = cleaned.substring(jsonObjectStart, jsonEnd);
    }
    
    return cleaned.trim();
  }

  private async callAI(prompt: string): Promise<string> {
    const systemPrompt = "You are a technical analyst that extracts verifiable proof-of-work signals from developer artifacts. Always return valid JSON.";

    if (this.provider === "gemini") {
      // Google Gemini API format
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;
      const response = await axios.post(
        this.apiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        },
        {
          headers: {
            "X-goog-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
      // Gemini response format: response.data.candidates[0].content.parts[0].text
      if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      }
      throw new Error("Invalid Gemini API response format");
    } else if (this.provider === "openai" || this.provider === "agent_router") {
      // OpenAI/Agent Router compatible format
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.choices[0].message.content;
    } else {
      // Anthropic API format
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\n${prompt}`,
            },
          ],
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.content[0].text;
    }
  }

  private buildSkillExtractionPrompt(
    username: string,
    repoCount: number,
    commitCount: number,
    prCount: number,
    languages: string[],
    timeWindow: { start: string; end: string }
  ): string {
    return `Analyze the developer's GitHub activity and extract skill scores.

Developer: ${username}
Time Period: ${timeWindow.start} to ${timeWindow.end}
Repositories: ${repoCount}
Commits: ${commitCount}
Pull Requests: ${prCount}
Languages: ${languages.join(", ") || "N/A"}

For each skill category (Backend Engineering, Frontend Engineering, DevOps/Infrastructure, Systems/Architecture), provide:
- Score (0-100)
- Confidence (0-100)
- Evidence (array of specific artifacts)

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks, no explanations. Just the JSON object.

Return JSON format with keys: backend_engineering, frontend_engineering, devops_infrastructure, systems_architecture`;
  }

  private buildImpactAnalysisPrompt(artifact: Artifact): string {
    let details = "";
    
    if (artifact.type === "pull_request") {
      const pr = artifact.data as any;
      details = `Type: Pull Request
Title: ${pr.title}
Body: ${pr.body || "N/A"}
State: ${pr.state}
Merged: ${pr.merged}
Additions: ${pr.additions || 0}
Deletions: ${pr.deletions || 0}
Author: ${pr.user?.login || "N/A"}`;
    } else if (artifact.type === "commit") {
      const commit = artifact.data as any;
      details = `Type: Commit
Message: ${commit.commit.message}
SHA: ${commit.sha}
Author: ${commit.author?.login || commit.commit.author?.name || "N/A"}`;
    } else if (artifact.type === "repo") {
      const repo = artifact.data as any;
      details = `Type: Repository
Name: ${repo.name}
Description: ${repo.description || "N/A"}
Is Fork: ${repo.fork || false}
Owner: ${repo.owner?.login || "N/A"}`;
    }
    
    return `Analyze this contribution's impact and complexity:

${details}

CRITICAL: Only score if this represents actual work by the user:
- If this is a fork with no user changes, set impact_score to 0
- If this shows work by others, set impact_score to 0
- Only give high scores for substantial user-authored contributions

Provide:
- impact_score (0-100): How significant is this user's contribution?
- complexity_delta (0-100): How complex are the user's changes?
- quality_indicators (has_tests, reviewed, refactored, documented)

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks, no explanations. Just the JSON object.

Return JSON format.`;
  }

  private parseSkillExtraction(response: string): SkillExtraction {
    try {
      const cleanedResponse = this.extractJSON(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return this.getDefaultSkillExtraction();
    }
  }

  private parseImpactAnalysis(response: string): ContributionImpact {
    try {
      const cleanedResponse = this.extractJSON(response);
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate and ensure structure matches ContributionImpact interface
      return {
        impact_score: typeof parsed.impact_score === 'number' ? parsed.impact_score : 50,
        complexity_delta: typeof parsed.complexity_delta === 'number' ? parsed.complexity_delta : 50,
        quality_indicators: {
          has_tests: parsed.quality_indicators?.has_tests === true,
          reviewed: parsed.quality_indicators?.reviewed === true,
          refactored: parsed.quality_indicators?.refactored === true,
          documented: parsed.quality_indicators?.documented === true,
        },
      };
    } catch (error) {
      console.error("Failed to parse impact analysis:", error);
      return {
        impact_score: 50,
        complexity_delta: 50,
        quality_indicators: {
          has_tests: false,
          reviewed: false,
          refactored: false,
          documented: false,
        },
      };
    }
  }

  private getDefaultSkillExtraction(): SkillExtraction {
    return {
      backend_engineering: { score: 0, confidence: 0, evidence: [] },
      frontend_engineering: { score: 0, confidence: 0, evidence: [] },
      devops_infrastructure: { score: 0, confidence: 0, evidence: [] },
      systems_architecture: { score: 0, confidence: 0, evidence: [] },
    };
  }
}

