"use client";

import React, { useState } from "react";
import { Card } from "../ui";
import { Copy, CheckCircle, XCircle, CircleNotch } from "phosphor-react";

interface PaymentFlowProps {
  paymentIntent: {
    address: string;
    amount: string;
    currency: "eth" | "usdc";
    planType: string;
    network: string;
  };
  onPaymentVerified: (txHash: string) => void;
  onCancel: () => void;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  paymentIntent,
  onPaymentVerified,
  onCancel,
}) => {
  const [txHash, setTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyAddress = () => {
    navigator.clipboard.writeText(paymentIntent.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!txHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const { apiClient } = await import("../../lib/api");
      const username = localStorage.getItem("username") || sessionStorage.getItem("username") || "";
      const result = await apiClient.verifyPayment(username, txHash.trim(), paymentIntent.planType);

      if (result.success) {
        onPaymentVerified(txHash.trim());
      } else {
        setError(result.message || "Payment verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="p-6 rounded-[16px]">
      <h3 className="text-lg font-semibold text-white mb-4">Complete Payment</h3>

      <div className="space-y-4">
        {/* Payment Amount */}
        <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.05)]">
          <p className="text-xs text-gray-400 mb-1">Amount to Pay</p>
          <p className="text-2xl font-bold text-white">
            {paymentIntent.amount} {paymentIntent.currency.toUpperCase()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Network: {paymentIntent.network}</p>
        </div>

        {/* QR Code - Using a simple text-based approach for now */}
        <div className="flex justify-center p-4 bg-white rounded-lg">
          <div className="text-xs text-gray-600 text-center">
            <p className="mb-2">Scan with your wallet:</p>
            <p className="font-mono break-all">{paymentIntent.address}</p>
            <p className="mt-2 text-gray-500">Or copy the address below</p>
          </div>
        </div>

        {/* Payment Address */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Send payment to:</p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(255,255,255,0.05)]">
            <code className="flex-1 text-xs text-gray-300 font-mono break-all">
              {paymentIntent.address}
            </code>
            <button
              onClick={copyAddress}
              className="flex-shrink-0 p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-400" weight="fill" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" weight="regular" />
              )}
            </button>
          </div>
        </div>

        {/* Transaction Hash Input */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Transaction Hash (after payment):</p>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
              <XCircle className="w-4 h-4" weight="fill" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-gray-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying || !txHash.trim()}
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                Verifying...
              </>
            ) : (
              "Verify Payment"
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          After sending payment, paste the transaction hash above and click "Verify Payment"
        </p>
      </div>
    </Card>
  );
};

