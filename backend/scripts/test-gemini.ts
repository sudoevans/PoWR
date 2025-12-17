import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("❌ GEMINI_API_KEY not found in .env file");
    console.log("\nPlease add to backend/.env:");
    console.log("GEMINI_API_KEY=your_api_key_here");
    process.exit(1);
  }

  console.log("🧪 Testing Google Gemini API connection...\n");
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

  const model = process.env.GEMINI_MODEL || "gemini-3-pro-preview";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    console.log(`Testing with model: ${model}`);
    console.log(`Endpoint: ${apiUrl}\n`);

    const response = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: "You are a technical analyst. Say hello and confirm you are working. Return a JSON object with status: 'ok'",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      },
      {
        headers: {
          "X-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) {
      console.log("✅ Gemini API is working!");
      console.log(`Response: ${response.data.candidates[0].content.parts[0].text}\n`);
    } else {
      console.log("⚠️ Unexpected response format:");
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error: any) {
    console.log("❌ Error with Gemini API:");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
    process.exit(1);
  }

  console.log("📝 Summary:");
  console.log("✅ Gemini API is configured correctly!");
  console.log("You can now use it in your PoWR application.\n");
}

testGemini()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });




