# Agent Router Troubleshooting Guide

## Issue: 401 Unauthorized Error

Based on the Agent Router website and documentation, here are the likely causes and solutions:

## Key Findings

1. **Registration Method**: Agent Router only accepts registration through:
   - GitHub (recommended)
   - Linux.do
   - **NOT** email/account registration

2. **API Endpoint**: ✅ Correct
   - URL: `https://agentrouter.org/v1/chat/completions`
   - Method: POST
   - Format: OpenAI-compatible

3. **Authentication**: Uses Bearer token in Authorization header ✅

## Possible Issues & Solutions

### Issue 1: Account Not Properly Registered

**Problem**: The API key might be from an account that wasn't registered through GitHub/Linux.do

**Solution**:
1. Go to https://agentrouter.org
2. Click "Sign up" or "立即注册"
3. **Register using GitHub** (not email)
4. Generate a new API key from the dashboard
5. Update `backend/.env` with the new key

### Issue 2: API Key Not Activated

**Problem**: The API key might need activation or approval

**Solution**:
1. Log into Agent Router dashboard (via GitHub)
2. Check if your API key is active/enabled
3. Generate a new key if needed
4. Make sure you have access to the models (gpt-52, claude-haiku-4-5-20251001)

### Issue 3: Account Needs Verification

**Problem**: New accounts might need manual verification

**Solution**:
1. Contact support: https://discord.com/invite/V6kaP6Rg44
2. Email: neo@agentrouter.org
3. QQ群: 1062402186

### Issue 4: Model Access

**Problem**: Your account might not have access to the models you're trying to use

**Solution**:
1. Check your Agent Router dashboard
2. Verify which models are available to your account
3. Use only the models you have access to

## Testing Steps

1. **Verify Registration**:
   - Make sure you registered via GitHub at https://agentrouter.org
   - Not via email (not supported)

2. **Check API Key**:
   - Log into dashboard
   - Verify API key is active
   - Copy the key exactly (no extra spaces)

3. **Test with Simple Request**:
   ```bash
   cd backend
   npm run test:agent-router
   ```

4. **If Still Failing**:
   - Contact support on Discord
   - Provide your API key prefix (first 10 chars)
   - Ask about account activation status

## Alternative: Use Mock Data

If Agent Router continues to have issues, the PoWR application will:
- Fall back to mock data automatically
- Still function for demo purposes
- You can add real AI analysis later

## Current Configuration

Your setup is correct:
- ✅ Endpoint: `https://agentrouter.org/v1/chat/completions`
- ✅ Models: `gpt-52`, `claude-haiku-4-5-20251001`
- ✅ Auth header: `Bearer {api_key}`
- ✅ Request format: OpenAI-compatible

The issue is likely with account/API key activation, not the code.



