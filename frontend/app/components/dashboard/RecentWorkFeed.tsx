"use client";

import React from "react";
import { Card } from "../ui";
import { 
  GithubLogo, 
  GitCommit, 
  GitPullRequest, 
  GitBranch, 
  GitMerge,
  ArrowSquareOut 
} from "phosphor-react";

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
  limit = 5,
}) => {
  const recentArtifacts = artifacts.slice(0, limit);

  const getIcon = (type: string) => {
    switch (type) {
      case "commit":
        return GitCommit;
      case "pull_request":
        return GitPullRequest;
      case "repo":
        return GitBranch;
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
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };


  return (
    <Card className="p-5 rounded-[16px]">
      <div className="flex items-center gap-2 mb-4">
        <GithubLogo className="w-4 h-4 text-violet-400" weight="fill" />
        <h2 className="text-sm font-medium text-violet-400" style={{ fontWeight: 500, fontSize: '14px' }}>
          Recent Verified Work
        </h2>
      </div>
      <div className="space-y-3">
        {recentArtifacts.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-xs" style={{ opacity: 0.6 }}>No artifacts yet</p>
        ) : (
          recentArtifacts.map((artifact, index) => {
            const Icon = getIcon(artifact.type);
            const title = getTitle(artifact);
            const timeAgo = formatDate(artifact.timestamp);
            
            return (
              <a
                key={artifact.id}
                href={getUrl(artifact)}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center gap-3 p-3 rounded-[14px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] transition-all duration-300 ease-out group hover:bg-[rgba(139,92,246,0.08)] hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:scale-[1.02]"
                style={{
                  animation: 'fadeInUp 0.3s ease-out backwards',
                  animationDelay: `${index * 20}ms`,
                }}
              >
                {/* Gradient glow on hover */}
                <div className="absolute inset-0 rounded-[14px] bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-fuchsia-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <Icon 
                  className="w-5 h-5 text-violet-400 flex-shrink-0 group-hover:text-violet-300 group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all duration-300 relative z-10" 
                  weight="regular" 
                />
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-xs font-medium text-gray-200 group-hover:text-white transition-all duration-300 truncate" style={{ fontWeight: 500 }}>
                    {title}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 group-hover:text-violet-300/60 transition-colors duration-300">
                    {timeAgo}
                  </p>
                </div>
                <ArrowSquareOut className="w-4 h-4 text-gray-500 group-hover:text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0 relative z-10" weight="regular" />
              </a>
            );
          })
        )}
      </div>
    </Card>
  );
};

