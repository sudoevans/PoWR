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
  // #region agent log
  const fs = require('fs');
  const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
  fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:9',message:'/profile route entry',data:{username:req.query.username,hasToken:!!req.query.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
  // #endregion
  try {
    const { username, access_token } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Check database first - only refresh if older than 24 hours
    const cachedProfile = dbService.getProfile(username as string);
    if (cachedProfile && !dbService.shouldRefreshProfile(username as string, 24)) {
      // #region agent log
      fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:20',message:'returning cached profile',data:{username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
      // #endregion
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

    // In production, get from database
    // For now, calculate on-the-fly
    progressTracker.setProgress(username as string, "ingestion", "Fetching your repositories...", 10);
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:30',message:'starting ingestion',data:{username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion
    const ingestionService = new ArtifactIngestionService(token);
    const ingested = await ingestionService.ingestUserArtifacts(username as string, 12);
    progressTracker.setProgress(username as string, "ingestion", `Found ${ingested.repos.length} repos, ${ingested.commits.length} commits, ${ingested.pullRequests.length} PRs`, 30);
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:33',message:'ingestion complete',data:{repoCount:ingested.repos.length,commitCount:ingested.commits.length,prCount:ingested.pullRequests.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion
    const artifacts = ingestionService.normalizeArtifacts(ingested, username as string);

    // Save artifacts to database
    dbService.saveArtifacts(username as string, artifacts);

    progressTracker.setProgress(username as string, "ai_analysis", "Analyzing your contributions with AI...", 40);
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:40',message:'starting AI extraction',data:{artifactCount:artifacts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');
    // #endregion
    const aiService = new AIAnalysisService();
    const aiExtraction = await aiService.extractSkills(
      username as string,
      artifacts,
      ingested.timeWindow
    );
    progressTracker.setProgress(username as string, "scoring", "Calculating your PoW scores...", 70);
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:47',message:'AI extraction complete',data:{hasExtraction:!!aiExtraction},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n');
    // #endregion

    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:50',message:'starting scoring',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion
    const scoringEngine = new ScoringEngine();
    const profile = await scoringEngine.generatePoWProfile(artifacts, aiExtraction);
    
    // Save profile to database
    dbService.saveProfile(username as string, profile, artifacts.length);
    
    // Ensure user has a subscription (creates free plan if first time)
    const { subscriptionService } = await import("../services/subscriptionService");
    const subscription = subscriptionService.getUserPlan(username as string);
    
    // Anchor to blockchain if configured (publish PoW to Sepolia)
    if (blockchainService.isConfigured()) {
      try {
        progressTracker.setProgress(username as string, "blockchain", "Anchoring proof to blockchain...", 90);
        // #region agent log
        fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:89',message:'anchoring to blockchain',data:{username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
        // #endregion
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
        // #region agent log
        fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:99',message:'blockchain anchoring complete',data:{txHash:proof.transactionHash},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
        // #endregion
      } catch (error: any) {
        console.error("Blockchain anchoring failed (non-critical):", error);
        // Don't fail the request if blockchain anchoring fails
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
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:107',message:'scoring complete, sending response',data:{hasProfile:!!profile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion

    res.json(profile);
    // Clear progress after sending response
    setTimeout(() => progressTracker.clearProgress(username as string), 1000);
  } catch (error: any) {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:61',message:'profile error',data:{error:error?.message||String(error),stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
    // #endregion
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to generate profile" });
  }
});

// Get user skills
router.get("/skills", async (req, res) => {
  try {
    const { username, access_token } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Try to get token from database if not provided
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
    res.status(500).json({ error: "Failed to calculate skills" });
  }
});

// Get verified artifacts
router.get("/artifacts", async (req, res) => {
  // #region agent log
  const fs = require('fs');
  const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
  fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:71',message:'/artifacts route entry',data:{username:req.query.username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
  // #endregion
  try {
    const { username, access_token } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Try to get from database first
    const cachedArtifacts = dbService.getArtifacts(username as string);
    if (cachedArtifacts.length > 0) {
      // #region agent log
      fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:81',message:'returning cached artifacts',data:{artifactCount:cachedArtifacts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
      // #endregion
      return res.json({ artifacts: cachedArtifacts });
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

    const ingestionService = new ArtifactIngestionService(token);
    const ingested = await ingestionService.ingestUserArtifacts(username as string, 12);
    const artifacts = ingestionService.normalizeArtifacts(ingested, username as string);
    
    // Save to database
    dbService.saveArtifacts(username as string, artifacts);
    
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:95',message:'/artifacts sending response',data:{artifactCount:artifacts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    // #endregion

    res.json({ artifacts });
  } catch (error: any) {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:100',message:'/artifacts error',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    // #endregion
    console.error("Artifacts error:", error);
    res.status(500).json({ error: "Failed to fetch artifacts" });
  }
});

// Trigger analysis
router.post("/analyze", async (req, res) => {
  try {
    const { username, access_token, monthsBack } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Check subscription status
    const { subscriptionService } = await import("../services/subscriptionService");
    const canUpdate = subscriptionService.canUserUpdate(username);
    
    if (!canUpdate.allowed) {
      return res.status(403).json({
        error: "Update not allowed",
        reason: canUpdate.reason,
        message: "Please upgrade your plan or wait for your scheduled update date.",
      });
    }

    // Try to get token from database if not provided
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
    const ingested = await ingestionService.ingestUserArtifacts(
      username,
      monthsBack || 12
    );
    const artifacts = ingestionService.normalizeArtifacts(ingested, username as string);

    const aiService = new AIAnalysisService();
    const aiExtraction = await aiService.extractSkills(
      username,
      artifacts,
      ingested.timeWindow
    );

    const scoringEngine = new ScoringEngine();
    const profile = await scoringEngine.generatePoWProfile(artifacts, aiExtraction);

    // Store in database
    dbService.saveArtifacts(username, artifacts);
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
        console.error("Blockchain anchoring failed (non-critical):", error);
        // Don't fail the request if blockchain anchoring fails
      }
    }

    // Reschedule next update if needed
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
    res.status(500).json({ error: "Failed to analyze artifacts" });
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
  // #region agent log
  const fs = require('fs');
  const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
  fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:130',message:'/proofs route entry',data:{username:req.query.username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
  // #endregion
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // Fetch from database
    const proofs = dbService.getBlockchainProofs(username as string);
    // #region agent log
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:139',message:'/proofs sending response',data:{proofCount:proofs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    // #endregion
    res.json({ proofs });
  } catch (error: any) {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Users\\user\\Desktop\\Hackathons\\PoWR\\.cursor\\debug.log';
    fs.appendFileSync(logPath, JSON.stringify({location:'routes/user.ts:141',message:'/proofs error',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    // #endregion
    console.error("Proofs error:", error);
    res.status(500).json({ error: "Failed to fetch proofs" });
  }
});

export default router;

