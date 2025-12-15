"use client";

import React from "react";
import { Card } from "../ui";

interface ScoreCardProps {
  overallIndex: number;
  previousIndex?: number;
  totalConnections?: number;
  numberOfPairs?: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  overallIndex,
  previousIndex,
  totalConnections = 0,
  numberOfPairs = 0,
}) => {
  const change = previousIndex ? overallIndex - previousIndex : 0;
  const changeText = change !== 0 ? `${change >= 0 ? "+" : ""}${change.toFixed(2)} pts` : null;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Score</h3>
      <div className="flex items-center justify-between mb-6">
        <div className="text-xs text-gray-500">
          <p>Total Connections: {totalConnections}</p>
          <p>No. of Pairs: {numberOfPairs}</p>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Gradient border wrapper */}
          <div
            className="w-32 h-32 rounded-full p-[3px]"
            style={{
              background: "linear-gradient(135deg, #ff6b9d, #ffa500)",
            }}
          >
            <div className="w-full h-full rounded-full bg-[#141519] flex items-center justify-center">
              <span className="text-white font-bold text-4xl">{overallIndex.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {changeText && (
          <p className={`text-sm mt-3 text-gray-400`}>
            {changeText}
          </p>
        )}
      </div>
    </Card>
  );
};


