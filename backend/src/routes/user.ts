import express from "express";
import { ArtifactIngestionService } from "../services/artifactIngestion";
import { AIAnalysisService } from "../services/aiAnalysis";
import { ScoringEngine } from "../services/scoringEngine";

const router = express.Router();

// Get user PoW profile
router.get("/profile", async (req, res) => {
  try {
    const { username, access_token } = req.query;

    if (!username || !access_token) {
      return res.status(400).json({ error: "Username and access token required" });
    }

    // In production, get from database
    // For now, calculate on-the-fly
    const ingestionService = new ArtifactIngestionService(access_token as string);
    const ingested = await ingestionService.ingestUserArtifacts(username as string, 12);
    const artifacts = ingestionService.normalizeArtifacts(ingested);

    const aiService = new AIAnalysisService();
    const aiExtraction = await aiService.extractSkills(
      username as string,
      artifacts,
      ingested.timeWindow
    );

    const scoringEngine = new ScoringEngine();
    const profile = await scoringEngine.generatePoWProfile(artifacts, aiExtraction);

    res.json(profile);
  } catch (error: any) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to generate profile" });
  }
});

// Get user skills
router.get("/skills", async (req, res) => {
  try {
    const { username, access_token } = req.query;

    if (!username || !access_token) {
      return res.status(400).json({ error: "Username and access token required" });
    }

    const ingestionService = new ArtifactIngestionService(access_token as string);
    const ingested = await ingestionService.ingestUserArtifacts(username as string, 12);
    const artifacts = ingestionService.normalizeArtifacts(ingested);

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
  try {
    const { username, access_token } = req.query;

    if (!username || !access_token) {
      return res.status(400).json({ error: "Username and access token required" });
    }

    const ingestionService = new ArtifactIngestionService(access_token as string);
    const ingested = await ingestionService.ingestUserArtifacts(username as string, 12);
    const artifacts = ingestionService.normalizeArtifacts(ingested);

    res.json({ artifacts });
  } catch (error: any) {
    console.error("Artifacts error:", error);
    res.status(500).json({ error: "Failed to fetch artifacts" });
  }
});

// Trigger analysis
router.post("/analyze", async (req, res) => {
  try {
    const { username, access_token, monthsBack } = req.body;

    if (!username || !access_token) {
      return res.status(400).json({ error: "Username and access token required" });
    }

    const ingestionService = new ArtifactIngestionService(access_token);
    const ingested = await ingestionService.ingestUserArtifacts(
      username,
      monthsBack || 12
    );
    const artifacts = ingestionService.normalizeArtifacts(ingested);

    const aiService = new AIAnalysisService();
    const aiExtraction = await aiService.extractSkills(
      username,
      artifacts,
      ingested.timeWindow
    );

    const scoringEngine = new ScoringEngine();
    const profile = await scoringEngine.generatePoWProfile(artifacts, aiExtraction);

    // TODO: Store in database

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

// Get on-chain proofs
router.get("/proofs", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    // TODO: Fetch from database/blockchain
    res.json({ proofs: [] });
  } catch (error: any) {
    console.error("Proofs error:", error);
    res.status(500).json({ error: "Failed to fetch proofs" });
  }
});

export default router;

