import express from "express";
import { ArtifactIngestionService } from "../services/artifactIngestion";
import { AIAnalysisService } from "../services/aiAnalysis";
import { ScoringEngine } from "../services/scoringEngine";
import { progressTracker } from "../services/progressTracker";
import { dbService } from "../services/database";
import { blockchainService } from "../services/blockchain";

const router = express.Router();

// Get user PoW profile
router.get("/profile", async (req, res) => {
  try {
    const { username, access_token } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Check database first - only refresh if older than 24 hours
    const cachedProfile = dbService.getProfile(username as string);
    if (cachedProfile && !dbService.shouldRefreshProfile(username as string, 24)) {
      return res.json(cachedProfile);
    }

    // Need to fetch fresh data - try to get token from database if not provided
    let token = access_token as string;
    if (!token) {
      const user = dbService.getUser(username as string);
      if (user && user.access_token_encrypted) {
        token = user.access_token_encrypted;
      } else {
        return res.status(401).json({ error: "Access token required. Please login again." });
      }
    }

    // Store user in database (update token if provided)
    if (access_token) {
      dbService.upsertUser(username as string, 0, access_token as string);
    }

    progressTracker.setProgress(username as string, "ingestion", "Fetching your repositories...", 10);
    const ingestionService = new ArtifactIngestionService(token);
    
    // Use FAST mode - only fetches repo metadata + events (~18 API calls vs 100+)
    const fastData = await ingestionService.ingestFast(username as string, 12);
    progressTracker.setProgress(username as string, "ingestion", `Found ${fastData.repos.length} repos with ${fastData.recentEvents.length} recent events`, 30);
    const artifacts = ingestionService.normalizeFastData(fastData, username as string);

    // Save artifacts to database
    dbService.saveArtifacts(username as string, artifacts);

    progressTracker.setProgress(username as string, "ai_analysis", "Analyzing your contributions with AI...", 40);
    const aiService = new AIAnalysisService();
    const aiExtraction = await aiService.extractSkills(
      username as string,
      artifacts,
      fastData.timeWindow
    );
    progressTracker.setProgress(username as string, "scoring", "Calculating your PoW scores...", 70);

    const scoringEngine = new ScoringEngine();
    const profile = await scoringEngine.generatePoWProfile(artifacts, aiExtraction);
    
    // Save profile to database
    dbService.saveProfile(username as string, profile, artifacts.length);
    
    // Ensure user has a subscription (creates free plan if first time)
    const { subscriptionService } = await import("../services/subscriptionService");
    const subscription = subscriptionService.ensureFreePlan(username as string);
    
    // Anchor to blockchain if configured (publish PoW to Sepolia)
    if (blockchainService.isConfigured()) {
      try {
        progressTracker.setProgress(username as string, "blockchain", "Anchoring proof to blockchain...", 90);
        const proof = await blockchainService.anchorSnapshot(artifacts, profile);
        
        // Save blockchain proof to database
        dbService.saveBlockchainProof(
          username as string,
          proof.transactionHash,
          proof.artifactHash,
          proof.blockNumber,
          proof.timestamp,
          proof.skillScores
        );
      } catch (error: any) {
        console.error("Blockchain anchoring failed (non-critical):", error);
      }
    }
    
    // Schedule next update based on subscription tier (if not already scheduled)
    if (subscription) {
      const allScheduled = dbService.getScheduledUpdates();
      const existingSchedule = allScheduled.find(
        s => s.username === username as string && s.status === 'pending'
      );
      if (!existingSchedule) {
        subscriptionService.scheduleUpdate(username as string, subscription.planType as any);
      }
    }
    
    progressTracker.setProgress(username as string, "complete", "Profile generated!", 100);

    res.json(profile);
    setTimeout(() => progressTracker.clearProgress(username as string), 1000);
  } catch (error: any) {
    console.error("Profile error:", error);
    res.status(500).json({ error: error.message || "Failed to generate profile" });
  }
});

// Get user skills
router.get("/skills", async (req, res) => {
  try {
    const { username, access_token } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    let token = access_token as string;
    if (!token) {
      const user = dbService.getUser(username as string);
      if (user && user.access_token_encrypted) {
        token = user.access_token_encrypted;
      } else {
        return res.status(401).json({ error: "Access token required. Please login again." });
      }
    }

    const ingestionService = new ArtifactIngestionService(token);
    const ingested = await ingestionService.ingestUserArtifacts(username as string, 12);
    const artifacts = ingestionService.normalizeArtifacts(ingested, username as string);

    const aiService = new AIAnalysisService();
    const aiExtraction = await aiService.extractSkills(
      username as string,
      artifacts,
      ingested.timeWindow
    );

    const scoringEngine = new ScoringEngine();
    const skillScores = await scoringEngine.calculatePoWScores(artifacts, aiExtraction);

    res.json({ skills: skillScores });
  } catch (error: any) {
    console.error("Skills error:", error);
    res.status(500).json({ error: error.message || "Failed to calculate skills" });
  }
});

// Get verified artifacts
router.get("/artifacts", async (req, res) => {
  try {
    const { username, access_token } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Try to get from database first
    const cachedArtifacts = dbService.getArtifacts(username as string);
    if (cachedArtifacts.length > 0) {
      return res.json({ artifacts: cachedArtifacts });
    }

    let token = access_token as string;
    if (!token) {
      const user = dbService.getUser(username as string);
      if (user && user.access_token_encrypted) {
        token = user.access_token_encrypted;
      } else {
        return res.status(401).json({ error: "Access token required. Please login again." });
      }
    }

    const ingestionService = new ArtifactIngestionService(token);
    const ingested = await ingestionService.ingestUserArtifacts(username as string, 12);
    const artifacts = ingestionService.normalizeArtifacts(ingested, username as string);
    
    dbService.saveArtifacts(username as string, artifacts);

    res.json({ artifacts });
  } catch (error: any) {
    console.error("Artifacts error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch artifacts" });
  }
});

// Trigger analysis
router.post("/analyze", async (req, res) => {
  try {
    const { username, access_token, monthsBack } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const { subscriptionService } = await import("../services/subscriptionService");
    
    // Ensure user has at least a free plan
    subscriptionService.ensureFreePlan(username);
    
    const canUpdate = subscriptionService.canUserUpdate(username);
    
    if (!canUpdate.allowed) {
      return res.status(403).json({
        error: "Update not allowed",
        reason: canUpdate.reason,
        message: "Please upgrade your plan or wait for your scheduled update date.",
      });
    }

    let token = access_token as string;
    if (!token) {
      const user = dbService.getUser(username as string);
      if (user && user.access_token_encrypted) {
        token = user.access_token_encrypted;
      } else {
        return res.status(401).json({ error: "Access token required. Please login again." });
      }
    }

    const ingestionService = new ArtifactIngestionService(token);
    const ingested = await ingestionService.ingestUserArtifacts(username, monthsBack || 12);
    const artifacts = ingestionService.normalizeArtifacts(ingested, username as string);

    const aiService = new AIAnalysisService();
    const aiExtraction = await aiService.extractSkills(username, artifacts, ingested.timeWindow);

    const scoringEngine = new ScoringEngine();
    const profile = await scoringEngine.generatePoWProfile(artifacts, aiExtraction);

    dbService.saveArtifacts(username, artifacts);
    dbService.saveProfile(username, profile, artifacts.length);

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
        console.error("Blockchain anchoring failed (non-critical):", error);
      }
    }

    const subscription = subscriptionService.getUserPlan(username);
    if (subscription) {
      subscriptionService.scheduleUpdate(username, subscription.planType as any);
    }

    res.json({
      success: true,
      profile,
      artifactsCount: artifacts.length,
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze artifacts" });
  }
});

// Get progress for a user
router.get("/progress", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }
    const progress = progressTracker.getProgress(username as string);
    if (!progress) {
      return res.json({ stage: "idle", message: "No analysis in progress", progress: 0 });
    }
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get progress" });
  }
});

// Get on-chain proofs
router.get("/proofs", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const proofs = dbService.getBlockchainProofs(username as string);
    res.json({ proofs });
  } catch (error: any) {
    console.error("Proofs error:", error);
    res.status(500).json({ error: "Failed to fetch proofs" });
  }
});

export default router;
