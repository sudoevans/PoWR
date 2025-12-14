"use client";

import React from "react";
import { Card } from "../ui";
import { GitCommit, GitPullRequest, FolderGit2, ExternalLink } from "lucide-react";

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

interface RecentWorkFeedProps {
  artifacts: Artifact[];
  limit?: number;
}

export const RecentWorkFeed: React.FC<RecentWorkFeedProps> = ({
  artifacts,
  limit = 10,
}) => {
  const recentArtifacts = artifacts.slice(0, limit);

  const getIcon = (type: string) => {
    switch (type) {
      case "commit":
        return GitCommit;
      case "pull_request":
        return GitPullRequest;
      case "repo":
        return FolderGit2;
      default:
        return GitCommit;
    }
  };

  const getTitle = (artifact: Artifact) => {
    if (artifact.type === "pull_request") {
      return artifact.data.title || `PR #${artifact.data.number}`;
    }
    if (artifact.type === "commit") {
      return artifact.data.commit?.message?.split("\n")[0] || "Commit";
    }
    return artifact.data.name || "Repository";
  };

  const getUrl = (artifact: Artifact) => {
    if (!artifact.repository) return "#";
    const { owner, name } = artifact.repository;
    if (artifact.type === "pull_request") {
      return `https://github.com/${owner}/${name}/pull/${artifact.data.number}`;
    }
    if (artifact.type === "commit") {
      return `https://github.com/${owner}/${name}/commit/${artifact.data.sha}`;
    }
    return `https://github.com/${owner}/${name}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white tracking-tight mb-6">
        Recent Verified Work
      </h2>
      <div className="space-y-4">
        {recentArtifacts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No artifacts yet</p>
        ) : (
          recentArtifacts.map((artifact) => {
            const Icon = getIcon(artifact.type);
            return (
              <a
                key={artifact.id}
                href={getUrl(artifact)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-lg bg-[#0A0B0D] hover:bg-[#1A1B1F] transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#141519] flex items-center justify-center text-[#0052FF] flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-[#0052FF] transition-colors truncate">
                    {getTitle(artifact)}
                  </p>
                  {artifact.repository && (
                    <p className="text-xs text-gray-400 mt-1">
                      {artifact.repository.owner}/{artifact.repository.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(artifact.timestamp)}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#0052FF] transition-colors flex-shrink-0 mt-1" />
              </a>
            );
          })
        )}
      </div>
    </Card>
  );
};

