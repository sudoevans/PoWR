# Setting Up GitHub OAuth for PoWR

## Quick Setup Guide

### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App" (or "New GitHub App" if you prefer)
3. Fill in the form:

**Application name:**
```
PoWR - Proof of Work Reputation
```

**Homepage URL:**
```
http://localhost:3000
```

**Authorization callback URL:**
```
http://localhost:3001/api/auth/github/callback
```

4. Click "Register application"
5. You'll see your **Client ID** and can generate a **Client Secret**

### Step 2: Add Credentials to Backend

1. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cd backend
   copy .env.example .env
   ```
   (On Windows PowerShell: `Copy-Item .env.example .env`)

2. Open `backend/.env` and replace:
   ```env
   GITHUB_CLIENT_ID=your_actual_client_id_here
   GITHUB_CLIENT_SECRET=your_actual_client_secret_here
   ```

### Step 3: Restart Backend

After adding credentials, restart your backend server:
```bash
cd backend
npm run dev
```

### Step 4: Test

1. Visit http://localhost:3000/auth
2. Click "Continue with GitHub"
3. You should be redirected to GitHub for authorization
4. After authorizing, you'll be redirected back with an access token

## Troubleshooting

### Error: "GitHub OAuth not configured"
- Make sure `backend/.env` file exists
- Verify `GITHUB_CLIENT_ID` is set (not "your_github_client_id")
- Restart the backend server after adding credentials

### Error: "redirect_uri_mismatch"
- Check that the callback URL in GitHub matches exactly:
  `http://localhost:3001/api/auth/github/callback`
- No trailing slashes, exact match required

### Error: 404 on GitHub
- Verify your Client ID is correct
- Make sure you're using OAuth App (not GitHub App) if that's what you created

## For Production

When deploying to production:
1. Update Homepage URL to your production domain
2. Update Callback URL to your production backend URL
3. Update `GITHUB_CALLBACK_URL` in production `.env`

## Alternative: Use GitHub App

If you created a GitHub App instead of OAuth App, you'll need to:
1. Use the App ID and Client ID
2. Generate a private key
3. Update the auth route to use GitHub App authentication

For MVP, OAuth App is simpler and recommended.



