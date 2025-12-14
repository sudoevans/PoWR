"use client";

import React from "react";
import { Card } from "../ui";
import { Link2, CheckCircle2 } from "lucide-react";

export interface Proof {
  id: string;
  hash: string;
  timestamp: string;
  transactionHash?: string;
  skillScores: number[];
}

interface OnChainProofsProps {
  proofs: Proof[];
}

export const OnChainProofs: React.FC<OnChainProofsProps> = ({
  proofs,
}) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 className="w-5 h-5 text-[#0052FF]" />
        <h2 className="text-xl font-semibold text-white tracking-tight">
          On-Chain Proofs
        </h2>
      </div>

      {proofs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-2">No proofs anchored yet</p>
          <p className="text-sm text-gray-500">
            Anchor your PoW snapshot on-chain to create an immutable proof
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="p-4 rounded-lg bg-[#0A0B0D] border border-[#141519]"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">
                    Snapshot #{proof.id}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(proof.timestamp)}
                  </p>
                </div>
                {proof.transactionHash && (
                  <a
                    href={getExplorerUrl(proof.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#0052FF] hover:text-[#0040CC] text-sm"
                  >
                    <Link2 className="w-4 h-4" />
                    View on BaseScan
                  </a>
                )}
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 font-mono break-all">
                  Hash: {proof.hash}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

