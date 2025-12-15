import { Artifact } from "./artifactIngestion";
import { PoWProfile } from "./scoringEngine";

// In-memory storage (always works, even on Fly.dev)
const store = {
  users: new Map<string, any>(),
  artifacts: new Map<string, Artifact[]>(),
  profiles: new Map<string, { profile: PoWProfile; artifactsCount: number; lastAnalyzed: Date }>(),
  proofs: new Map<string, any[]>(),
  subscriptions: new Map<string, any>(),
  scheduledUpdates: [] as any[],
};

export class DatabaseService {
  // User management
  upsertUser(username: string, githubId: number, accessToken?: string) {
    const existing = store.users.get(username);
    store.users.set(username, {
      username,
      github_id: githubId,
      access_token_encrypted: accessToken || existing?.access_token_encrypted,
      last_updated: new Date().toISOString(),
    });
  }

  getUser(username: string) {
    return store.users.get(username) || null;
  }

  // Artifact management
  saveArtifacts(username: string, artifacts: Artifact[]) {
    store.artifacts.set(username, artifacts);
  }

  getArtifacts(username: string, since?: Date): Artifact[] {
    const artifacts = store.artifacts.get(username) || [];
    if (!since) return artifacts;
    return artifacts.filter(a => new Date(a.timestamp) >= since);
  }

  // Profile management
  saveProfile(username: string, profile: PoWProfile, artifactsCount: number) {
    store.profiles.set(username, {
      profile,
      artifactsCount,
      lastAnalyzed: new Date(),
    });
  }

  getProfile(username: string): PoWProfile | null {
    const data = store.profiles.get(username);
    return data?.profile || null;
  }

  shouldRefreshProfile(username: string, maxAgeHours: number = 24): boolean {
    const data = store.profiles.get(username);
    if (!data) return true;
    const hoursSince = (Date.now() - data.lastAnalyzed.getTime()) / (1000 * 60 * 60);
    return hoursSince >= maxAgeHours;
  }

  // Blockchain proof management
  saveBlockchainProof(
    username: string,
    transactionHash: string,
    artifactHash: string,
    blockNumber: number,
    timestamp: number,
    skillScores: number[]
  ) {
    const proofs = store.proofs.get(username) || [];
    proofs.unshift({
      id: proofs.length + 1,
      transactionHash,
      artifactHash,
      blockNumber,
      timestamp,
      skillScores,
      createdAt: new Date().toISOString(),
    });
    store.proofs.set(username, proofs);
  }

  getBlockchainProofs(username: string): any[] {
    return store.proofs.get(username) || [];
  }

  getLatestBlockchainProof(username: string): any | null {
    const proofs = store.proofs.get(username) || [];
    return proofs[0] || null;
  }

  // Subscription management
  saveSubscription(username: string, subscription: any) {
    store.subscriptions.set(username, {
      ...subscription,
      username,
      updated_at: new Date().toISOString(),
    });
  }

  // Alias for compatibility
  createSubscription(username: string, planType: string, paymentAddress?: string, paymentTxHash?: string) {
    this.saveSubscription(username, {
      plan_type: planType,
      status: "active",
      payment_address: paymentAddress,
      last_payment_tx_hash: paymentTxHash,
      created_at: new Date().toISOString(),
    });
  }

  // Alias for compatibility  
  updateSubscription(username: string, updates: any) {
    const existing = store.subscriptions.get(username) || {};
    store.subscriptions.set(username, {
      ...existing,
      ...updates,
      username,
      updated_at: new Date().toISOString(),
    });
  }

  // Alias for compatibility
  cancelSubscription(username: string) {
    const sub = store.subscriptions.get(username);
    if (sub) {
      sub.status = "cancelled";
      sub.updated_at = new Date().toISOString();
      store.subscriptions.set(username, sub);
    }
  }

  getSubscription(username: string): any | null {
    return store.subscriptions.get(username) || null;
  }

  updateSubscriptionNextUpdate(username: string, nextUpdateDate: Date) {
    const sub = store.subscriptions.get(username);
    if (sub) {
      sub.next_update_date = nextUpdateDate.toISOString();
      store.subscriptions.set(username, sub);
    }
  }

  // Scheduled updates
  scheduleUpdate(username: string, scheduledDate: Date, planType: string) {
    store.scheduledUpdates.push({
      id: store.scheduledUpdates.length + 1,
      username,
      scheduled_date: scheduledDate.toISOString(),
      status: "pending",
      plan_type: planType,
      created_at: new Date().toISOString(),
    });
  }

  getScheduledUpdates(beforeDate?: Date): any[] {
    if (!beforeDate) return store.scheduledUpdates;
    return store.scheduledUpdates.filter(
      u => u.status === "pending" && new Date(u.scheduled_date) <= beforeDate
    );
  }

  getPendingUpdates(): any[] {
    const now = new Date();
    return store.scheduledUpdates.filter(
      u => u.status === "pending" && new Date(u.scheduled_date) <= now
    );
  }

  markUpdateComplete(id: number) {
    const update = store.scheduledUpdates.find(u => u.id === id);
    if (update) update.status = "completed";
  }

  // Alias for compatibility
  markScheduledUpdateComplete(id: number) {
    this.markUpdateComplete(id);
  }

  markUpdateFailed(id: number, error: string) {
    const update = store.scheduledUpdates.find(u => u.id === id);
    if (update) {
      update.status = "failed";
      update.error = error;
    }
  }

  // Alias for compatibility
  markScheduledUpdateFailed(id: number, error?: string) {
    this.markUpdateFailed(id, error || "Unknown error");
  }

  // Payment management
  savePaymentTransaction(
    username: string,
    txHash: string,
    amount: string,
    currency: string,
    planType: string,
    blockNumber?: number
  ) {
    // In-memory: just track it
    console.log(`Payment recorded: ${username} - ${txHash} - ${amount} ${currency} - block: ${blockNumber}`);
  }

  getPaymentTransaction(txHash: string): any | null {
    return null;
  }

  updatePaymentStatus(txHash: string, status: string, blockNumber?: number) {
    console.log(`Payment status updated: ${txHash} -> ${status}`);
  }

  // Alias for compatibility
  updatePaymentTransactionStatus(txHash: string, status: string, blockNumber?: number) {
    this.updatePaymentStatus(txHash, status, blockNumber);
  }

  // Cleanup old data (no-op for in-memory)
  cleanupOldArtifacts(olderThanDays: number) {
    // In production with SQLite, this would delete old data
  }

  cleanupOldProofs(olderThanDays: number) {
    // In production with SQLite, this would delete old data
  }
}

export const dbService = new DatabaseService();
