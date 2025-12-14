import express from "express";
import axios from "axios";

const router = express.Router();

// GitHub OAuth initiation
router.get("/github", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || "http://localhost:3001/api/auth/github/callback";
  const scope = "read:user public_repo";
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: "No authorization code provided" });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      return res.status(400).json({ error: "Failed to obtain access token" });
    }
    
    // Get user info from GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });
    
    const user = userResponse.data;
    
    // TODO: Store user and token in database
    // For now, return user info and token (in production, use JWT)
    res.json({
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      access_token, // In production, don't send this directly
    });
  } catch (error: any) {
    console.error("GitHub OAuth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;

