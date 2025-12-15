import { dbService } from "./database";
import { ethers } from "ethers";

export type PlanType = "free" | "basic" | "pro";

export interface SubscriptionPlan {
  type: PlanType;
  name: string;
  price: number;
  priceInCrypto: {
    eth: string;
    usdc: string;
  };
  updateFrequency: string;
  features: string[];
}

export class SubscriptionService {
  private static readonly PLANS: Record<PlanType, SubscriptionPlan> = {
    free: {
      type: "free",
      name: "Free",
      price: 0,
      priceInCrypto: { eth: "0", usdc: "0" },
      updateFrequency: "Every two weeks",
      features: [
        "Basic PoW profile",
        "Onchain proofs",
        "Public profile page",
      ],
    },
    basic: {
      type: "basic",
      name: "Basic",
      price: 6,
      priceInCrypto: { eth: "0.002", usdc: "6" }, // Approximate conversion
      updateFrequency: "Weekly (every Monday)",
      features: [
        "All free features",
        "Weekly profile updates",
        "Priority support",
      ],
    },
    pro: {
      type: "pro",
      name: "Pro",
      price: 15,
      priceInCrypto: { eth: "0.005", usdc: "15" }, // Approximate conversion
      updateFrequency: "Real-time (GitHub webhooks)",
      features: [
        "All basic features",
        "Real-time updates on commits/PRs",
        "Advanced analytics",
        "API access",
      ],
    },
  };

  getAvailablePlans(): SubscriptionPlan[] {
    return Object.values(SubscriptionService.PLANS);
  }

  getPlan(planType: PlanType): SubscriptionPlan {
    return SubscriptionService.PLANS[planType];
  }

  getUserPlan(username: string): any {
    return dbService.getSubscription(username);
  }

  async upgradePlan(
    username: string,
    planType: PlanType,
    paymentTxHash: string
  ): Promise<void> {
    // Verify payment first
    const payment = dbService.getPaymentTransaction(paymentTxHash);
    if (!payment || payment.status !== "confirmed") {
      throw new Error("Payment not confirmed");
    }

    // Update subscription
    const nextUpdateDate = this.getNextUpdateDate(planType);
    dbService.createSubscription(username, planType, undefined, paymentTxHash);
    dbService.updateSubscription(username, {
      nextUpdateDate: nextUpdateDate ?? undefined,
    });

    // Schedule first update
    this.scheduleUpdate(username, planType);
  }

  cancelPlan(username: string): void {
    dbService.cancelSubscription(username);
  }

  scheduleUpdate(username: string, planType: PlanType): void {
    const nextDate = this.getNextUpdateDate(planType);
    if (nextDate) {
      dbService.scheduleUpdate(username, nextDate, planType);
      dbService.updateSubscription(username, { nextUpdateDate: nextDate });
    }
  }

  getNextUpdateDate(planType: PlanType): Date | null {
    const now = new Date();
    const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    switch (planType) {
      case "free":
        // Every two weeks (14 days)
        const twoWeeksFromNow = new Date(utcNow);
        twoWeeksFromNow.setUTCDate(utcNow.getUTCDate() + 14);
        twoWeeksFromNow.setUTCHours(0, 0, 0, 0);
        return twoWeeksFromNow;

      case "basic":
        // Every Monday
        const daysUntilMonday = (8 - utcNow.getUTCDay()) % 7 || 7;
        const nextMonday = new Date(utcNow);
        nextMonday.setUTCDate(utcNow.getUTCDate() + daysUntilMonday);
        nextMonday.setUTCHours(0, 0, 0, 0);
        return nextMonday;

      case "pro":
        // Real-time, no scheduling needed
        return null;

      default:
        return null;
    }
  }

  async verifyPayment(
    txHash: string,
    expectedAmount: string,
    currency: "eth" | "usdc"
  ): Promise<boolean> {
    try {
      const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const tx = await provider.getTransaction(txHash);
      
      if (!tx || !tx.blockNumber) {
        return false;
      }

      // Verify transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return false;
      }

      // Check if payment address matches
      const paymentAddress = process.env.PAYMENT_WALLET_ADDRESS?.toLowerCase();
      if (paymentAddress && tx.to?.toLowerCase() !== paymentAddress) {
        return false;
      }

      // Update payment transaction status
      dbService.updatePaymentTransactionStatus(txHash, "confirmed", receipt.blockNumber);

      return true;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  }

  canUserUpdate(username: string): { allowed: boolean; reason?: string } {
    const subscription = this.getUserPlan(username);
    if (!subscription) {
      return { allowed: false, reason: "No subscription found" };
    }

    const planType = subscription.planType as PlanType;

    if (planType === "pro") {
      return { allowed: true };
    }

    if (planType === "free") {
      const now = new Date();
      const nextUpdate = subscription.nextUpdateDate
        ? new Date(subscription.nextUpdateDate)
        : null;

      if (!nextUpdate) {
        // First time, allow update
        return { allowed: true };
      }

      // Check if we're within 24 hours of scheduled update
      const timeDiff = nextUpdate.getTime() - now.getTime();
      const hoursUntilUpdate = timeDiff / (1000 * 60 * 60);

      if (hoursUntilUpdate <= 24 && hoursUntilUpdate >= -24) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `Next update scheduled for ${nextUpdate.toLocaleDateString()}`,
      };
    }

    if (planType === "basic") {
      const now = new Date();
      const lastUpdate = subscription.updatedAt ? new Date(subscription.updatedAt) : null;
      const nextUpdate = subscription.nextUpdateDate
        ? new Date(subscription.nextUpdateDate)
        : null;

      if (!lastUpdate || !nextUpdate) {
        return { allowed: true };
      }

      // Check if we're within 24 hours of scheduled update
      const timeDiff = nextUpdate.getTime() - now.getTime();
      const hoursUntilUpdate = timeDiff / (1000 * 60 * 60);

      if (hoursUntilUpdate <= 24 && hoursUntilUpdate >= -24) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `Next update scheduled for ${nextUpdate.toLocaleDateString()}`,
      };
    }

    return { allowed: false, reason: "Unknown plan type" };
  }
}

export const subscriptionService = new SubscriptionService();

