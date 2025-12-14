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

  async getUserRepos(username: string): Promise<GitHubRepo[]> {
    const response = await this.client.get(`/users/${username}/repos`, {
      params: {
        sort: "updated",
        per_page: 100,
        type: "all",
      },
    });
    return response.data;
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

