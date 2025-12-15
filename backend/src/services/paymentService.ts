import { dbService } from "./database";
import { subscriptionService, PlanType } from "./subscriptionService";
import { ethers } from "ethers";

export interface PaymentIntent {
  address: string;
  amount: string;
  currency: "eth" | "usdc";
  planType: PlanType;
  network: "base-sepolia" | "base";
}

export class PaymentService {
  private getPaymentAddress(): string {
    const address = process.env.PAYMENT_WALLET_ADDRESS;
    if (!address) {
      throw new Error("PAYMENT_WALLET_ADDRESS not configured");
    }
    return address;
  }

  createPaymentIntent(planType: PlanType, currency: "eth" | "usdc" = "eth"): PaymentIntent {
    const plan = subscriptionService.getPlan(planType);
    
    if (planType === "free") {
      throw new Error("Free plan does not require payment");
    }

    const amount = plan.priceInCrypto[currency];
    const address = this.getPaymentAddress();

    return {
      address,
      amount,
      currency,
      planType,
      network: process.env.NODE_ENV === "production" ? "base" : "base-sepolia",
    };
  }

  async verifyPayment(txHash: string): Promise<{
    verified: boolean;
    amount?: string;
    currency?: string;
    blockNumber?: number;
  }> {
    try {
      const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        return { verified: false };
      }

      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return { verified: false };
      }

      // Get transaction value (for ETH payments)
      const value = ethers.formatEther(tx.value || 0);

      // Check if payment address matches
      const paymentAddress = this.getPaymentAddress().toLowerCase();
      if (tx.to?.toLowerCase() !== paymentAddress) {
        return { verified: false };
      }

      return {
        verified: true,
        amount: value,
        currency: "eth",
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      return { verified: false };
    }
  }

  async processPayment(
    username: string,
    txHash: string,
    planType: PlanType
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Verify payment
      const verification = await this.verifyPayment(txHash);
      if (!verification.verified) {
        return { success: false, message: "Payment verification failed" };
      }

      // Check if transaction already processed
      const existing = dbService.getPaymentTransaction(txHash);
      if (existing && existing.status === "confirmed") {
        return { success: false, message: "Payment already processed" };
      }

      // Save payment transaction
      if (!existing) {
        dbService.savePaymentTransaction(
          username,
          txHash,
          verification.amount || "0",
          verification.currency || "eth",
          planType,
          verification.blockNumber
        );
      }

      // Update payment status
      dbService.updatePaymentTransactionStatus(
        txHash,
        "confirmed",
        verification.blockNumber
      );

      // Upgrade user's subscription
      await subscriptionService.upgradePlan(username, planType, txHash);

      return { success: true };
    } catch (error: any) {
      console.error("Payment processing error:", error);
      return { success: false, message: error.message || "Payment processing failed" };
    }
  }

  getPaymentStatus(txHash: string): {
    status: "pending" | "confirmed" | "failed" | "not_found";
    transaction?: any;
  } {
    const transaction = dbService.getPaymentTransaction(txHash);
    if (!transaction) {
      return { status: "not_found" };
    }

    return {
      status: transaction.status as "pending" | "confirmed" | "failed",
      transaction,
    };
  }
}

export const paymentService = new PaymentService();

