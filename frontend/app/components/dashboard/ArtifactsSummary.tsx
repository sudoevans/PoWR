"use client";

import React from "react";
import { GithubLogo, GitBranch, GitCommit, GitMerge } from "phosphor-react";

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
      icon: GithubLogo,
      iconColor: "text-cyan-400",
    },
    {
      label: "PRs Merged",
      value: mergedPRs,
      icon: GitMerge,
      iconColor: "text-emerald-400",
    },
    {
      label: "Total Commits",
      value: commits,
      icon: GitCommit,
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="h-[84px] px-[18px] py-4 rounded-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] flex items-center justify-between"
        >
          <stat.icon className={`w-6 h-6 ${stat.iconColor} flex-shrink-0`} weight="fill" />
          <div className="flex-1 text-right">
            <p className={`text-[13px] mb-1 tracking-wide ${stat.iconColor}`} style={{ letterSpacing: '0.02em', opacity: 0.8 }}>
              {stat.label}
            </p>
            <p className="text-[28px] font-bold text-white" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

