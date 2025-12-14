"use client";

import React from "react";
import { Card } from "../ui";
import { Code, GitMerge, FolderGit2 } from "lucide-react";

interface ArtifactsSummaryProps {
  repos: number;
  commits: number;
  pullRequests: number;
  mergedPRs: number;
}

export const ArtifactsSummary: React.FC<ArtifactsSummaryProps> = ({
  repos,
  commits,
  pullRequests,
  mergedPRs,
}) => {
  const stats = [
    {
      label: "Repos Analyzed",
      value: repos,
      icon: FolderGit2,
      color: "text-[#0052FF]",
    },
    {
      label: "PRs Merged",
      value: mergedPRs,
      icon: GitMerge,
      color: "text-green-400",
    },
    {
      label: "Total Commits",
      value: commits,
      icon: Code,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full bg-[#0A0B0D] flex items-center justify-center ${stat.color}`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

