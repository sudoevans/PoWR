import axios, { AxiosInstance } from "axios";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    type: string;
  };
  fork: boolean;
  parent?: {
    full_name: string;
  };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  };
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  merged: boolean;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface GitHubUserStats {
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepoLanguages {
  [language: string]: number; // bytes of code per language
}

export class GitHubService {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    this.client = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
  }

  async getUserStats(username: string): Promise<GitHubUserStats> {
    const response = await this.client.get(`/users/${username}`);
    return response.data;
  }

  async getUserRepos(username: string): Promise<GitHubRepo[]> {
    const response = await this.client.get(`/users/${username}/repos`, {
      params: {
        sort: "updated",
        per_page: 100,
        type: "owner",
      },
    });
    return response.data;
  }

  async getRepoLanguages(owner: string, repo: string): Promise<GitHubRepoLanguages> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/languages`);
      return response.data;
    } catch {
      return {};
    }
  }

  async getRepoContributorStats(owner: string, repo: string, username: string): Promise<{
    totalCommits: number;
    additions: number;
    deletions: number;
  } | null> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/stats/contributors`);
      const stats = response.data?.find((c: any) => c.author?.login === username);
      if (!stats) return null;
      return {
        totalCommits: stats.total || 0,
        additions: stats.weeks?.reduce((sum: number, w: any) => sum + (w.a || 0), 0) || 0,
        deletions: stats.weeks?.reduce((sum: number, w: any) => sum + (w.d || 0), 0) || 0,
      };
    } catch {
      return null;
    }
  }

  async getUserEvents(username: string, perPage: number = 100): Promise<any[]> {
    try {
      const response = await this.client.get(`/users/${username}/events/public`, {
        params: { per_page: perPage },
      });
      return response.data;
    } catch {
      return [];
    }
  }

  async getRepoCommits(owner: string, repo: string, since?: string): Promise<GitHubCommit[]> {
    const params: any = {
      per_page: 100,
    };
    
    if (since) {
      params.since = since;
    }
    
    const response = await this.client.get(`/repos/${owner}/${repo}/commits`, { params });
    return response.data;
  }

  async getRepoPullRequests(owner: string, repo: string, state: "all" | "open" | "closed" = "all"): Promise<GitHubPullRequest[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/pulls`, {
      params: {
        state,
        per_page: 100,
        sort: "updated",
      },
    });
    return response.data;
  }

  async getPullRequestDetails(owner: string, repo: string, prNumber: number): Promise<GitHubPullRequest> {
    const response = await this.client.get(`/repos/${owner}/${repo}/pulls/${prNumber}`);
    return response.data;
  }

  async getCommitDetails(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    const response = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`);
    return response.data;
  }
}

