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

  constructor() {
    // Prefer OpenAI, fallback to Anthropic
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "";
    this.apiUrl = process.env.OPENAI_API_KEY
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";
    this.model = process.env.OPENAI_API_KEY
      ? "gpt-4"
      : "claude-3-opus-20240229";
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

  private async callAI(prompt: string): Promise<string> {
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are a technical analyst that extracts verifiable proof-of-work signals from developer artifacts. Always return valid JSON.",
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
              content: prompt,
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
Deletions: ${pr.deletions || 0}`;
    } else if (artifact.type === "commit") {
      const commit = artifact.data as any;
      details = `Type: Commit
Message: ${commit.commit.message}
SHA: ${commit.sha}`;
    }
    
    return `Analyze this contribution's impact and complexity:

${details}

Provide:
- impact_score (0-100)
- complexity_delta (0-100)
- quality_indicators (has_tests, reviewed, refactored, documented)

Return JSON format.`;
  }

  private parseSkillExtraction(response: string): SkillExtraction {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return this.getDefaultSkillExtraction();
    }
  }

  private parseImpactAnalysis(response: string): ContributionImpact {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      return JSON.parse(jsonStr);
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

