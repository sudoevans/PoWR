import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

async function testAgentRouter() {
  const apiKey = process.env.AGENT_ROUTER_API_KEY;

  if (!apiKey) {
    console.log("❌ AGENT_ROUTER_API_KEY not found in .env file");
    console.log("\nPlease add to backend/.env:");
    console.log("AGENT_ROUTER_API_KEY=your_api_key_here");
    process.exit(1);
  }

  console.log("🧪 Testing Agent Router connection...\n");
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

  // Test with Claude Haiku (default)
  console.log("Test 1: Testing with claude-haiku-4-5-20251001...");
  try {
    const response = await axios.post(
      "https://agentrouter.org/v1/chat/completions",
      {
        model: "claude-haiku-4-5-20251001",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Respond in JSON format.",
          },
          {
            role: "user",
            content: "Say hello and confirm you are working. Return a JSON object with status: 'ok'",
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      console.log("✅ Claude Haiku is working!");
      console.log(`Response: ${response.data.choices[0].message.content}\n`);
    } else {
      console.log("⚠️ Unexpected response format:", JSON.stringify(response.data, null, 2));
    }
  } catch (error: any) {
    console.log("❌ Error with Claude Haiku:");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
    console.log();
  }

  // Test with GPT-52
  console.log("Test 2: Testing with gpt-52...");
  try {
    const response = await axios.post(
      "https://agentrouter.org/v1/chat/completions",
      {
        model: "gpt-52",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Respond in JSON format.",
          },
          {
            role: "user",
            content: "Say hello and confirm you are working. Return a JSON object with status: 'ok'",
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      console.log("✅ GPT-52 is working!");
      console.log(`Response: ${response.data.choices[0].message.content}\n`);
    } else {
      console.log("⚠️ Unexpected response format:", JSON.stringify(response.data, null, 2));
    }
  } catch (error: any) {
    console.log("❌ Error with GPT-52:");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
    console.log();
  }

  console.log("📝 Summary:");
  console.log("If both tests passed, Agent Router is configured correctly!");
  console.log("You can now use it in your PoWR application.\n");
  
  if (apiKey) {
    console.log("⚠️  If you got 401 errors:");
    console.log("   1. Verify your API key is correct");
    console.log("   2. Check if your Agent Router account is activated");
    console.log("   3. Contact support: https://discord.com/invite/V6kaP6Rg44");
    console.log("   4. Make sure you have access to the models you're testing");
  }
}

testAgentRouter()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

