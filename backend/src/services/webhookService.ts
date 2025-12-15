import crypto from "crypto";
import { dbService } from "./database";
import { subscriptionService } from "./subscriptionService";
import { ArtifactIngestionService } from "./artifactIngestion";
import { AIAnalysisService } from "./aiAnalysis";
import { ScoringEngine } from "./scoringEngine";
import { blockchainService } from "./blockchain";

export interface GitHubWebhookEvent {
  action?: string;
  repository?: {
    owner: { login: string };
    name: string;
    full_name: string;
  };
  sender?: {
    login: string;
  };
  commits?: Array<{
    author: { username: string };
    message: string;
  }>;
  pull_request?: {
    user: { login: string };
    state: string;
  };
  ref?: string;
}

export class WebhookService {
  private getWebhookSecret(): string {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("GITHUB_WEBHOOK_SECRET not configured");
    }
    return secret;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const secret = this.getWebhookSecret();
      const hmac = crypto.createHmac("sha256", secret);
      const digest = "sha256=" + hmac.update(payload).digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      );
    } catch (error) {
      console.error("Webhook signature verification error:", error);
      return false;
    }
  }

  async processWebhookEvent(
    event: GitHubWebhookEvent,
    eventType: string
  ): Promise<void> {
    // Only process for Pro plan users
    // Extract username from event
    const username = this.extractUsernameFromEvent(event, eventType);
    if (!username) {
      console.log("Could not extract username from webhook event");
      return;
    }

    // Check if user has Pro plan
    const subscription = subscriptionService.getUserPlan(username);
    if (!subscription || subscription.planType !== "pro" || subscription.status !== "active") {
      console.log(`User ${username} does not have active Pro subscription`);
      return;
    }

    // Process real-time update
    console.log(`Processing real-time update for Pro user ${username} (event: ${eventType})`);
    await this.triggerRealTimeUpdate(username);
  }

  private extractUsernameFromEvent(
    event: GitHubWebhookEvent,
    eventType: string
  ): string | null {
    switch (eventType) {
      case "push":
        return event.commits?.[0]?.author?.username || event.sender?.login || null;
      
      case "pull_request":
        return event.pull_request?.user?.login || event.sender?.login || null;
      
      case "repository":
        // For repository events, we need to check if the owner matches a user
        return event.repository?.owner?.login || event.sender?.login || null;
      
      default:
        return event.sender?.login || null;
    }
  }

  private async triggerRealTimeUpdate(username: string) {
    try {
      // Get user's access token
      const user = dbService.getUser(username);
      if (!user || !user.access_token_encrypted) {
        console.error(`No access token found for user ${username}`);
        return;
      }

      // Ingest artifacts (only recent ones for real-time updates)
      const ingestionService = new ArtifactIngestionService(user.access_token_encrypted);
      const ingested = await ingestionService.ingestUserArtifacts(username, 1); // Last month only
      const artifacts = ingestionService.normalizeArtifacts(ingested, username);

      // Save artifacts
      dbService.saveArtifacts(username, artifacts);

      // AI analysis
      const aiService = new AIAnalysisService();
      const aiExtraction = await aiService.extractSkills(
        username,
        artifacts,
        ingested.timeWindow
      );

      // Generate profile
      const scoringEngine = new ScoringEngine();
      const profile = await scoringEngine.generatePoWProfile(artifacts, aiExtraction);

      // Save profile
      dbService.saveProfile(username, profile, artifacts.length);

      // Anchor to blockchain if configured
      if (blockchainService.isConfigured()) {
        try {
          const proof = await blockchainService.anchorSnapshot(artifacts, profile);
          dbService.saveBlockchainProof(
            username,
            proof.transactionHash,
            proof.artifactHash,
            proof.blockNumber,
            proof.timestamp,
            proof.skillScores
          );
        } catch (error) {
          console.error(`Blockchain anchoring failed for ${username}:`, error);
        }
      }

      console.log(`Real-time update completed for ${username}`);
    } catch (error) {
      console.error(`Real-time update failed for ${username}:`, error);
      throw error;
    }
  }

  registerWebhookForUser(username: string): string {
    // Generate a unique webhook secret for the user
    const secret = crypto.randomBytes(32).toString("hex");
    dbService.updateSubscription(username, { webhookSecret: secret });
    return secret;
  }

  unregisterWebhookForUser(username: string): void {
    dbService.updateSubscription(username, { webhookSecret: undefined });
  }
}

export const webhookService = new WebhookService();

