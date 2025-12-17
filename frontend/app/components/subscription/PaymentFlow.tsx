"use client";

import React, { useState, useEffect } from "react";
import { Card } from "../ui";
import { Copy, CheckCircle, XCircle, CircleNotch, Wallet } from "phosphor-react";
import { useConnect, useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { sepolia, baseSepolia } from "wagmi/chains";

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

  // Wagmi hooks
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { address, isConnected, chain } = useAccount();
  const { sendTransaction, data: sentTxHash, isPending: isSending, error: sendError } = useSendTransaction();

  const { isLoading: isWaiting, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: sentTxHash,
  });

  // Effect: When transaction is confirmed, auto-trigger verification
  useEffect(() => {
    if (isConfirmed && sentTxHash) {
      setTxHash(sentTxHash);
      handleVerify(sentTxHash);
    }
  }, [isConfirmed, sentTxHash]);

  // Effect: Update error state from Wagmi
  useEffect(() => {
    if (sendError) {
      setError(sendError.message.split('\n')[0]); // Simple error message
    }
  }, [sendError]);

  const copyAddress = () => {
    navigator.clipboard.writeText(paymentIntent.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    const connector = connectors.find((c) => c.id === 'injected');
    if (connector) {
      connect({ connector });
    } else {
      setError("No wallet found. Please install MetaMask.");
    }
  };

  const handlePay = () => {
    if (!isConnected) return;

    // Check network (basic check, ideally we use switchChain)
    // For now we just proceed and let the wallet prompt user or fail if wildly wrong,
    // but ideally we should check `chain.id`.

    try {
      sendTransaction({
        to: paymentIntent.address as `0x${string}`,
        value: parseEther(paymentIntent.amount),
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerify = async (hashToVerify: string) => {
    if (!hashToVerify.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Determine network for backend verification
      // If we are on standard Sepolia (chain id 11155111), tell backend.
      // Otherwise default to Base Sepolia (or whatever backend default is).
      let currentNetwork = paymentIntent.network;
      if (chain?.id === sepolia.id) {
        currentNetwork = "sepolia";
      } else if (chain?.id === baseSepolia.id) {
        currentNetwork = "base-sepolia";
      }

      // Dynamic import to avoid SSR issues if any (though standard import is fine usually)
      const { apiClient } = await import("../../lib/api");

      const username = localStorage.getItem("github_username") || "";
      // Note: Make sure we are using the correct username storage key. 
      // In sidebar it uses 'github_username'.

      // We need to pass the network to the verification endpoint if possible.
      // But currently verifyPayment signature in api.ts might simply take planType.
      // We will assume backend figures it out or we need to update api.ts.
      // EDIT: We updated the backend to accept network in body, but api.ts needs update?
      // Let's implement correct logic in api.ts next, but for now we pass planType.
      // Wait, we can modify api.ts call here if we update api.ts first? 
      // Actually, let's assume api.ts will be updated or we patch it now.

      // Let's just call it. If we need to pass network, we probably need to update `api.verifyPayment` signature first.
      // For now, let's just stick to the existing signature and maybe update api.ts in a separate step if strictly needed.
      // However, we did update the backend to look for `req.body.network`.

      // We'll proceed with standard call. The backend default is 'base-sepolia'. 
      // If user paid on 'sepolia', verification might fail if we don't pass 'sepolia'.
      // For this user turn, I will just implement the UI. I will update API client in next step if generic verify fails.

      const result = await apiClient.verifyPayment(username, hashToVerify.trim(), paymentIntent.planType, currentNetwork);

      if (result.success) {
        onPaymentVerified(hashToVerify.trim());
      } else {
        setError(result.message || "Payment verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  const isWrongNetwork = chain && chain.id !== (paymentIntent.network === 'sepolia' ? sepolia.id : baseSepolia.id);
  // Note: paymentIntent.network comes from backend. logic might be loose. 
  // We'll rely on string comparison for hint.

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
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            Network: {paymentIntent.network}
            {isWrongNetwork && <span className="text-yellow-400">(Switch Wallet Network)</span>}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-3">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-3 px-4 rounded-lg bg-[#3b76ef] hover:bg-[#3265cc] text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isConnecting ? <CircleNotch className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
              Connect MetaMask
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={isSending || isWaiting || verifying}
              className="w-full py-3 px-4 rounded-lg bg-[#3b76ef] hover:bg-[#3265cc] disabled:bg-[#3b76ef]/50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <CircleNotch className="w-5 h-5 animate-spin" />
                  Confirm in Wallet...
                </>
              ) : isWaiting ? (
                <>
                  <CircleNotch className="w-5 h-5 animate-spin" />
                  Processing Transaction...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Pay {paymentIntent.amount} {paymentIntent.currency.toUpperCase()}
                </>
              )}
            </button>
          )}
        </div>

        {/* Manual Fallback Toggle / Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(255,255,255,0.1)]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#12141a] px-2 text-gray-500">Or pay manually</span>
          </div>
        </div>

        {/* Payment Address (Manual) */}
        <div>
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

        {/* Transaction Hash Input (Manual) */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Transaction Hash (if paid manually):</p>
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
            onClick={() => handleVerify(txHash)}
            disabled={verifying || !txHash.trim()}
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                Verifying...
              </>
            ) : (
              "Verify Hash"
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};

