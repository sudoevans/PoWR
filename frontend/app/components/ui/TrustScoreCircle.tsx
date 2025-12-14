import React from "react";

interface TrustScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const TrustScoreCircle: React.FC<TrustScoreCircleProps> = ({
  score,
  size = "md",
  showLabel = true,
}) => {
  const sizes = {
    sm: "w-16 h-16 text-xl",
    md: "w-24 h-24 text-3xl",
    lg: "w-32 h-32 text-4xl",
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizes[size]} rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold`}
      >
        {score}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-400">Trust Score</span>
      )}
    </div>
  );
};

