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
    const allRepos = await this.githubService.getUserRepos(username);

    // STRICT FILTERING: Only include repos where user is the OWNER (not just a collaborator)
    // This ensures we only show projects the user actually authored/created
    const ownedRepos = allRepos.filter((repo) => {
      // Must be owned by the user
      const isOwner = repo.owner.login === username;
      // Must NOT be a fork (forks are handled separately)
      const isNotFork = repo.fork === false;
      return isOwner && isNotFork;
    });
    
    // For forks, we'll check if user has actual commits (but they won't count as "authored" projects)
    const forkedRepos = allRepos.filter((repo) => repo.fork === true);

    // Collect commits and PRs from repos
    const commits: GitHubCommit[] = [];
    const pullRequests: GitHubPullRequest[] = [];
    const relevantOwnedRepos: GitHubRepo[] = [];
    const relevantForkedRepos: GitHubRepo[] = [];

    // Process owned repos - only include if user has actual contributions
    for (const repo of ownedRepos) {
      const [owner, repoName] = repo.full_name.split("/");
      
      try {
        // Get commits authored by the user
        const repoCommits = await this.githubService.getRepoCommits(
          owner,
          repoName,
          since
        );
        
        // STRICT FILTERING: Only include commits where the user is the author
        const userCommits = repoCommits.filter((commit) => {
          // Verify author login matches username
          const authorLogin = commit.author?.login;
          if (!authorLogin || authorLogin !== username) {
            return false;
          }
          
          // Verify commit is within time window
          const commitDate = new Date(commit.commit.author.date);
          return commitDate >= startDate;
        });

        // Get pull requests authored by the user
        const repoPRs = await this.githubService.getRepoPullRequests(
          owner,
          repoName,
          "all"
        );
        
        // STRICT FILTERING: Only include PRs authored by the user
        const userPRs = repoPRs.filter((pr) => {
          const createdAt = new Date(pr.created_at);
          return createdAt >= startDate && pr.user.login === username;
        });
        
        // Only include repo if user has actual contributions (commits or PRs)
        if (userCommits.length > 0 || userPRs.length > 0) {
          relevantOwnedRepos.push(repo);
          commits.push(...userCommits);
          pullRequests.push(...userPRs);
        }
      } catch (error) {
        console.error(`Error fetching data for ${repo.full_name}:`, error);
        // Continue with other repos
      }
    }

    // Process forked repos - only include if user has commits in their fork
    // This ensures we don't include forks where the user never made changes
    for (const repo of forkedRepos) {
      const [owner, repoName] = repo.full_name.split("/");
      
      try {
        // CRITICAL: Check if user has commits in their fork
        // This is the key check - if user forked but never committed, exclude it
        const repoCommits = await this.githubService.getRepoCommits(
          owner,
          repoName,
          since
        );
        
        // STRICT FILTERING: Only include commits where the user is the author
        const userCommits = repoCommits.filter((commit) => {
          const authorLogin = commit.author?.login;
          if (!authorLogin || authorLogin !== username) {
            return false;
          }
          const commitDate = new Date(commit.commit.author.date);
          return commitDate >= startDate;
        });

        // Get pull requests authored by the user (to upstream or within fork)
        const repoPRs = await this.githubService.getRepoPullRequests(
          owner,
          repoName,
          "all"
        );
        
        // STRICT FILTERING: Only include PRs authored by the user
        const userPRs = repoPRs.filter((pr) => {
          const createdAt = new Date(pr.created_at);
          return createdAt >= startDate && pr.user.login === username;
        });
        
        // Only include forked repo if user has actual commits in their fork
        // This prevents including forks where user just forked but never contributed
        if (userCommits.length > 0) {
          relevantForkedRepos.push(repo);
          commits.push(...userCommits);
          pullRequests.push(...userPRs);
        } else if (userPRs.length > 0) {
          // If no commits but has PRs, include it (PRs are contributions)
          relevantForkedRepos.push(repo);
          pullRequests.push(...userPRs);
        }
        // If neither commits nor PRs, exclude the fork entirely
      } catch (error) {
        console.error(`Error fetching data for forked repo ${repo.full_name}:`, error);
        // Continue with other repos
      }
    }

    // Only return owned repos (not forks) - user authored these projects
    // Forks are excluded from the repos list but their commits/PRs are still included
    return {
      repos: relevantOwnedRepos, // Only owned repos, no forks
      commits,
      pullRequests,
      timeWindow: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  normalizeArtifacts(ingested: IngestedArtifacts, username?: string): Artifact[] {
    const artifacts: Artifact[] = [];

    // Add repos - only include if they have associated commits or PRs
    // This ensures we don't include repos where user has no actual contributions
    const reposWithContributions = new Set<string>();
    
    // Track which repos have commits
    ingested.commits.forEach((commit) => {
      // Try to find the repo this commit belongs to
      const repo = ingested.repos.find((r) => {
        const [owner] = r.full_name.split("/");
        return commit.author?.login === owner || commit.commit.message.includes(r.name);
      });
      if (repo) {
        reposWithContributions.add(repo.full_name);
      }
    });
    
    // Track which repos have PRs
    ingested.pullRequests.forEach((pr) => {
      // Extract repo from PR head or base
      const repo = ingested.repos.find((r) => {
        const repoName = r.name.toLowerCase();
        return pr.head?.ref?.includes(repoName) || pr.base?.ref?.includes(repoName);
      });
      if (repo) {
        reposWithContributions.add(repo.full_name);
      }
    });

    // Only add repos that have actual contributions
    // CRITICAL: Only include repos where user is the OWNER (not collaborator)
    for (const repo of ingested.repos) {
      // Skip forks entirely - user didn't author them, just forked them
      if (repo.fork) {
        continue; // Don't include forks as "authored" projects
      }
      
      // Only include if repo has contributions AND user is the owner
      const [owner] = repo.full_name.split("/");
      if (owner !== username) {
        continue; // Skip repos where user is not the owner
      }
      
      // Only include if we found contributions
      if (!reposWithContributions.has(repo.full_name)) {
        continue; // Skip repos without user contributions
      }
      
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

    // Add commits - verify authorship
    for (const commit of ingested.commits) {
      // Double-check author matches username if provided
      if (username && commit.author?.login && commit.author.login !== username) {
        continue; // Skip commits not by the user
      }
      
      // Find the repo this commit belongs to
      const repo = ingested.repos.find((r) => {
        const [owner, repoName] = r.full_name.split("/");
        // Try multiple methods to match commit to repo
        return commit.commit.message.includes(repoName) || 
               commit.sha.startsWith(repoName) ||
               (commit.author?.login === owner);
      });
      
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

    // Add pull requests - verify authorship
    for (const pr of ingested.pullRequests) {
      // Double-check author matches username if provided
      if (username && pr.user?.login && pr.user.login !== username) {
        continue; // Skip PRs not by the user
      }
      
      // Try to find the repo from PR data
      const repo = ingested.repos.find((r) => {
        const repoName = r.name.toLowerCase();
        return pr.head?.ref?.toLowerCase().includes(repoName) || 
               pr.base?.ref?.toLowerCase().includes(repoName);
      });
      
      artifacts.push({
        type: "pull_request",
        id: `pr-${pr.id}`,
        data: pr,
        timestamp: pr.created_at,
        repository: repo ? {
          owner: repo.full_name.split("/")[0],
          name: repo.full_name.split("/")[1],
        } : {
          owner: pr.head?.ref?.split("/")[0] || "unknown",
          name: pr.head?.ref?.split("/")[1] || "unknown",
        },
      });
    }

    return artifacts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

