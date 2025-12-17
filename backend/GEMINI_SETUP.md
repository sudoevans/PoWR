# Google Gemini API Setup

The PoWR platform now uses Google's Gemini API for AI analysis. This guide will help you set it up.

## Getting Your Gemini API Key

1. **Go to Google AI Studio**:
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**:
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy your API key

3. **Add to Backend Environment**:
   - Open `backend/.env`
   - Add your API key:
     ```
     GEMINI_API_KEY=AIzaSyAvHU_y6HxGeJ2IsYKWohwz-Iin_aXTj1A
     ```

4. **Optional: Specify Model**:
   - Default model: `gemini-2.0-flash` (fast and efficient)
   - You can override with:
     ```
     GEMINI_MODEL=gemini-2.0-flash
     ```
   - Other available models:
     - `gemini-2.0-flash` (default - fastest)
     - `gemini-1.5-pro` (more capable, slower)
     - `gemini-1.5-flash` (balanced)
     - `gemini-3-pro-preview` (most capable, slowest)

## Testing the Setup

Run the test script to verify your API key works:

```bash
cd backend
npm run test:gemini
```

You should see:
```
✅ Gemini API is working!
Response: {"status": "ok"}
```

## API Details

- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Authentication**: `X-goog-api-key` header (not Bearer token)
- **Request Format**: 
  ```json
  {
    "contents": [{
      "parts": [{
        "text": "your prompt here"
      }]
    }],
    "generationConfig": {
      "temperature": 0.3,
      "topK": 40,
      "topP": 0.95,
      "maxOutputTokens": 4096
    }
  }
  ```
- **Response Format**: 
  ```json
  {
    "candidates": [{
      "content": {
        "parts": [{
          "text": "response text"
        }]
      }
    }]
  }
  ```

## Fallback Providers

If `GEMINI_API_KEY` is not set, the system will fall back to:
1. Agent Router (`AGENT_ROUTER_API_KEY`)
2. OpenAI (`OPENAI_API_KEY`)
3. Anthropic (`ANTHROPIC_API_KEY`)

## Troubleshooting

### 401 Unauthorized
- Verify your API key is correct
- Check that the API key is enabled in Google AI Studio
- Ensure you have quota/credits available

### 403 Forbidden
- Check API restrictions in Google Cloud Console
- Verify the model name is correct

### Rate Limits
- Free tier has rate limits
- Consider upgrading if you need higher throughput

## Next Steps

Once your API key is configured:
1. Restart the backend server
2. Test the full flow by analyzing a GitHub profile
3. Check the dashboard to see AI-generated skill scores

