"use client";

import React from "react";
import { Card } from "../ui";
import { Check } from "phosphor-react";

export interface Plan {
  type: "free" | "basic" | "pro";
  name: string;
  price: number;
  priceInCrypto: {
    eth: string;
    usdc: string;
  };
  updateFrequency: string;
  features: string[];
}

interface PlanCardProps {
  plan: Plan;
  currentPlan?: string;
  onSelect: (planType: string) => void;
  loading?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlan,
  onSelect,
  loading = false,
}) => {
  const isCurrentPlan = currentPlan === plan.type;
  const isFree = plan.type === "free";

  return (
    <Card
      className={`p-6 rounded-[16px] relative ${
        isCurrentPlan
          ? "border-2 border-blue-500 bg-[rgba(59,130,246,0.1)]"
          : "border border-[rgba(255,255,255,0.04)]"
      } ${plan.type === "pro" ? "ring-2 ring-purple-500/20" : ""}`}
    >
      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
            Current
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            {plan.price === 0 ? "Free" : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-gray-400">/month</span>
          )}
        </div>
        {plan.price > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {plan.priceInCrypto.eth} ETH or {plan.priceInCrypto.usdc} USDC
          </p>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-3">Update Frequency:</p>
        <p className="text-sm text-white font-medium">{plan.updateFrequency}</p>
      </div>

      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-3">Features:</p>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" weight="bold" />
              <span className="text-sm text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onSelect(plan.type)}
        disabled={isCurrentPlan || loading}
        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
          isCurrentPlan
            ? "bg-[rgba(255,255,255,0.05)] text-gray-400 cursor-not-allowed"
            : isFree
            ? "bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white"
            : plan.type === "pro"
            ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {loading ? "Processing..." : isCurrentPlan ? "Current Plan" : isFree ? "Select Free" : `Upgrade to ${plan.name}`}
      </button>
    </Card>
  );
};


