# Agent Router Setup for PoWR

## Overview

PoWR uses Agent Router (https://agentrouter.org) for AI analysis, which provides access to:
- **GPT-52** (`gpt-52`)
- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) - default

Agent Router uses the same OpenAI-compatible `/v1/chat/completions` endpoint, making it a drop-in replacement.

## Setup

### Step 1: Get Agent Router API Key

1. Visit: https://agentrouter.org
2. Sign up for an account
3. Get your API key from the dashboard

### Step 2: Add to Backend `.env`

Add to `backend/.env`:

```env
AGENT_ROUTER_API_KEY=your_agent_router_api_key_here
```

### Step 3: Optional - Choose Model

By default, the service uses `claude-haiku-4-5-20251001`. To use GPT-52 instead, set it via environment variable:

```env
AGENT_ROUTER_API_KEY=your_key
AGENT_ROUTER_MODEL=gpt-52
```

Or to use Claude Haiku (default):

```env
AGENT_ROUTER_API_KEY=your_key
AGENT_ROUTER_MODEL=claude-haiku-4-5-20251001
```

### Step 4: Restart Backend

After adding the API key, restart your backend:

```bash
cd backend
npm run dev
```

## Fallback Behavior

If `AGENT_ROUTER_API_KEY` is not set, the service will fall back to:
1. `OPENAI_API_KEY` (if set)
2. `ANTHROPIC_API_KEY` (if set)
3. Mock data (if none are set)

## Model Comparison

- **GPT-52**: Advanced model for complex analysis, more accurate skill extraction
- **Claude Haiku 4.5**: Faster responses, cost-effective, good for simpler tasks (default)

## Testing

Once configured, test the AI analysis by:
1. Logging in with GitHub
2. Clicking "Refresh Analysis" on the dashboard
3. The system will use Agent Router to analyze your GitHub artifacts

## Troubleshooting

- **401 Unauthorized**: 
  - Check that your API key is correct
  - Verify your Agent Router account is activated
  - Contact support: https://discord.com/invite/V6kaP6Rg44
  - Make sure you have access to the models (gpt-52 or claude-haiku-4-5-20251001)
- **Model not found**: Verify the model name matches exactly: `gpt-52` or `claude-haiku-4-5-20251001`
- **Rate limits**: Agent Router may have rate limits - check your dashboard

## Testing

Test your Agent Router setup:

```bash
cd backend
npm run test:agent-router
```

This will test both available models and show you which ones work.

