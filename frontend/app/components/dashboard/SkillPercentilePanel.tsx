"use client";

import React from "react";
import { Card, SkillBar, PercentileBadge } from "../ui";

export interface SkillScore {
  skill: string;
  score: number;
  percentile: number;
  confidence: number;
  artifactCount: number;
}

interface SkillPercentilePanelProps {
  skills: SkillScore[];
}

export const SkillPercentilePanel: React.FC<SkillPercentilePanelProps> = ({
  skills,
}) => {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white tracking-tight mb-6">
        Skill Percentiles
      </h2>
      <div className="space-y-6">
        {skills.map((skill) => (
          <div key={skill.skill} className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                {skill.skill}
              </span>
              <PercentileBadge percentile={skill.percentile} size="sm" />
            </div>
            <SkillBar
              skill={skill.skill}
              score={skill.score}
              percentile={skill.percentile}
              confidence={skill.confidence}
            />
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{skill.artifactCount} artifacts</span>
              <span>Confidence: {skill.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

