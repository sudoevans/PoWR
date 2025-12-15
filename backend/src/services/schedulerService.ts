import cron from "node-cron";
import { dbService } from "./database";
import { ArtifactIngestionService } from "./artifactIngestion";
import { AIAnalysisService } from "./aiAnalysis";
import { ScoringEngine } from "./scoringEngine";
import { blockchainService } from "./blockchain";
import { subscriptionService } from "./subscriptionService";

export class SchedulerService {
  private cronJobs: cron.ScheduledTask[] = [];

  start() {
    console.log("Starting scheduler service...");

    // Run daily at midnight UTC to check for due updates
    // This handles free plan (every 2 weeks) and basic plan (weekly) updates
    const dailyJob = cron.schedule("0 0 * * *", async () => {
      console.log("Processing scheduled updates...");
      // Process all due updates regardless of plan type
      const now = new Date();
      const scheduledUpdates = dbService.getScheduledUpdates(now);
      
      // Group by plan type for logging
      const freeUpdates = scheduledUpdates.filter(u => u.planType === "free");
      const basicUpdates = scheduledUpdates.filter(u => u.planType === "basic");
      
      console.log(`Found ${freeUpdates.length} free plan updates and ${basicUpdates.length} basic plan updates due`);
      
      for (const update of scheduledUpdates) {
        try {
          await this.processScheduledUpdate(update.username, update.id);
        } catch (error) {
          console.error(
            `Failed to process scheduled update for ${update.username}:`,
            error
          );
          dbService.markScheduledUpdateFailed(update.id);
        }
      }
    });
    this.cronJobs.push(dailyJob);

    console.log("Scheduler service started");
  }

  stop() {
    this.cronJobs.forEach((job) => job.stop());
    this.cronJobs = [];
    console.log("Scheduler service stopped");
  }

  private async processScheduledUpdate(username: string, scheduleId: number) {
    console.log(`Processing scheduled update for ${username}...`);

    // Get user's access token
    const user = dbService.getUser(username);
    if (!user || !user.access_token_encrypted) {
      throw new Error(`No access token found for user ${username}`);
    }

    // Ingest artifacts
    const ingestionService = new ArtifactIngestionService(user.access_token_encrypted);
    const ingested = await ingestionService.ingestUserArtifacts(username, 12);
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
        // Don't fail the update if blockchain fails
      }
    }

    // Mark as completed
    dbService.markScheduledUpdateComplete(scheduleId);

    // Reschedule next update
    const subscription = subscriptionService.getUserPlan(username);
    if (subscription) {
      subscriptionService.scheduleUpdate(username, subscription.planType as any);
    }

    console.log(`Completed scheduled update for ${username}`);
  }

  rescheduleNextUpdate(username: string, planType: "free" | "basic" | "pro") {
    if (planType === "pro") {
      // Pro plan doesn't need scheduling
      return;
    }

    const nextDate = subscriptionService.getNextUpdateDate(planType);
    if (nextDate) {
      dbService.scheduleUpdate(username, nextDate, planType);
      dbService.updateSubscription(username, { nextUpdateDate: nextDate });
    }
  }
}

export const schedulerService = new SchedulerService();

