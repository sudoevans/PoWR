"use client";

import { Card, TrustScoreCircle } from "../ui";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import React from "react";

interface PowIndexCardProps {
  overallIndex: number;
  previousIndex?: number;
}

export const PowIndexCard: React.FC<PowIndexCardProps> = ({
  overallIndex,
  previousIndex,
}) => {
  const change = previousIndex ? overallIndex - previousIndex : 0;
  const changePercent = previousIndex
    ? ((change / previousIndex) * 100).toFixed(1)
    : null;

  return (
    <Card className="flex flex-col items-center justify-center p-8">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-white tracking-tight">
          Proof-of-Work Index
        </h2>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="text-gray-400 hover:text-gray-300">
                <HelpCircle className="w-4 h-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-[#141519] text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
                sideOffset={5}
              >
                Weighted average of all skill-specific PoW scores
                <Tooltip.Arrow className="fill-[#141519]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      <TrustScoreCircle score={overallIndex} size="lg" />

      {changePercent && (
        <div
          className={`flex items-center gap-1 mt-4 ${
            change >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {change >= 0 ? "+" : ""}
            {changePercent}%
          </span>
        </div>
      )}
    </Card>
  );
};

