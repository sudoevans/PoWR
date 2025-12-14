const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
}

export interface Artifact {
  type: "repo" | "commit" | "pull_request";
  id: string;
  data: any;
  timestamp: string;
  repository?: {
    owner: string;
    name: string;
  };
}

export interface Proof {
  id: string;
  hash: string;
  timestamp: string;
  transactionHash?: string;
  skillScores: number[];
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserProfile(username: string, accessToken: string): Promise<PoWProfile> {
    return this.request<PoWProfile>(
      `/api/user/profile?username=${username}&access_token=${accessToken}`
    );
  }

  async getUserSkills(username: string, accessToken: string): Promise<{ skills: SkillPoWScore[] }> {
    return this.request<{ skills: SkillPoWScore[] }>(
      `/api/user/skills?username=${username}&access_token=${accessToken}`
    );
  }

  async getUserArtifacts(username: string, accessToken: string): Promise<{ artifacts: Artifact[] }> {
    return this.request<{ artifacts: Artifact[] }>(
      `/api/user/artifacts?username=${username}&access_token=${accessToken}`
    );
  }

  async triggerAnalysis(
    username: string,
    accessToken: string,
    monthsBack?: number
  ): Promise<{ success: boolean; profile: PoWProfile; artifactsCount: number }> {
    return this.request<{ success: boolean; profile: PoWProfile; artifactsCount: number }>(
      `/api/user/analyze`,
      {
        method: "POST",
        body: JSON.stringify({ username, access_token: accessToken, monthsBack }),
      }
    );
  }

  async getProofs(username: string): Promise<{ proofs: any[] }> {
    return this.request<{ proofs: any[] }>(`/api/user/proofs?username=${username}`);
  }
}

export const apiClient = new ApiClient();

