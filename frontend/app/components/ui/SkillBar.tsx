import React from "react";

interface SkillBarProps {
  skill: string;
  score: number; // 0-100
  percentile?: number; // 0-100
  confidence?: number; // 0-100
  showPercentile?: boolean;
}

export const SkillBar: React.FC<SkillBarProps> = ({
  skill,
  score,
  percentile,
  confidence,
  showPercentile = true,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{skill}</span>
        <div className="flex items-center gap-3">
          {showPercentile && percentile !== undefined && (
            <span className="text-xs text-gray-400">Top {100 - percentile}%</span>
          )}
          <span className="text-sm font-bold text-[#3b76ef]">{score}</span>
        </div>
      </div>
      <div className="w-full h-2 bg-[#0A0B0D] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3b76ef] transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
      {confidence !== undefined && (
        <span className="text-xs text-gray-500">Confidence: {confidence}%</span>
      )}
    </div>
  );
};

