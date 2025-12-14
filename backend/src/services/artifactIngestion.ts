import { GitHubService, GitHubRepo, GitHubCommit, GitHubPullRequest } from "./githubService";

export interface Artifact {
  type: "repo" | "commit" | "pull_request";
  id: string;
  data: GitHubRepo | GitHubCommit | GitHubPullRequest;
  timestamp: string;
  repository?: {
    owner: string;
    name: string;
  };
}

export interface IngestedArtifacts {
  repos: GitHubRepo[];
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  timeWindow: {
    start: string;
    end: string;
  };
}

export class ArtifactIngestionService {
  private githubService: GitHubService;

  constructor(accessToken: string) {
    this.githubService = new GitHubService(accessToken);
  }

  async ingestUserArtifacts(
    username: string,
    monthsBack: number = 12
  ): Promise<IngestedArtifacts> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const since = startDate.toISOString();

    // Get all repositories
    const repos = await this.githubService.getUserRepos(username);

    // Filter repos updated in time window
    const relevantRepos = repos.filter((repo) => {
      const updatedAt = new Date(repo.updated_at);
      return updatedAt >= startDate;
    });

    // Collect commits and PRs from relevant repos
    const commits: GitHubCommit[] = [];
    const pullRequests: GitHubPullRequest[] = [];

    for (const repo of relevantRepos) {
      const [owner, repoName] = repo.full_name.split("/");
      
      try {
        // Get commits
        const repoCommits = await this.githubService.getRepoCommits(
          owner,
          repoName,
          since
        );
        commits.push(...repoCommits);

        // Get pull requests
        const repoPRs = await this.githubService.getRepoPullRequests(
          owner,
          repoName,
          "all"
        );
        
        // Filter PRs by time window
        const relevantPRs = repoPRs.filter((pr) => {
          const createdAt = new Date(pr.created_at);
          return createdAt >= startDate;
        });
        
        pullRequests.push(...relevantPRs);
      } catch (error) {
        console.error(`Error fetching data for ${repo.full_name}:`, error);
        // Continue with other repos
      }
    }

    return {
      repos: relevantRepos,
      commits,
      pullRequests,
      timeWindow: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  normalizeArtifacts(ingested: IngestedArtifacts): Artifact[] {
    const artifacts: Artifact[] = [];

    // Add repos
    for (const repo of ingested.repos) {
      artifacts.push({
        type: "repo",
        id: `repo-${repo.id}`,
        data: repo,
        timestamp: repo.updated_at,
        repository: {
          owner: repo.full_name.split("/")[0],
          name: repo.full_name.split("/")[1],
        },
      });
    }

    // Add commits
    for (const commit of ingested.commits) {
      const repo = ingested.repos.find((r) => 
        commit.commit.message.includes(r.name) || 
        commit.sha.startsWith(r.name)
      );
      
      artifacts.push({
        type: "commit",
        id: `commit-${commit.sha}`,
        data: commit,
        timestamp: commit.commit.author.date,
        repository: repo ? {
          owner: repo.full_name.split("/")[0],
          name: repo.full_name.split("/")[1],
        } : undefined,
      });
    }

    // Add pull requests
    for (const pr of ingested.pullRequests) {
      artifacts.push({
        type: "pull_request",
        id: `pr-${pr.id}`,
        data: pr,
        timestamp: pr.created_at,
        repository: {
          owner: pr.head.ref.split("/")[0] || "unknown",
          name: pr.head.ref.split("/")[1] || "unknown",
        },
      });
    }

    return artifacts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

