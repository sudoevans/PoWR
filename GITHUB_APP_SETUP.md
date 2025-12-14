# GitHub App Registration Guide for PoWR

## GitHub App Registration Values

### Basic Information

**GitHub App name:**
```
PoWR - Proof of Work Reputation
```

**Description (Markdown supported):**
```markdown
PoWR is a proof-of-work reputation system that analyzes your GitHub activity to generate verifiable skill signals. We analyze your commits, pull requests, and repositories to create an objective, artifact-backed profile of your development work.

**What we do:**
- Analyze your public GitHub repositories
- Extract skill signals from your code contributions
- Generate proof-of-work scores for different technical skills
- Create verifiable, on-chain reputation snapshots

**Privacy:**
- We only access your public repositories
- We never store your code
- We only analyze metadata and contribution patterns
- All analysis is transparent and verifiable
```

**Homepage URL:**
```
https://powr.xyz
```
*(For development, you can use: `http://localhost:3000` or your deployed URL)*

### Identifying and Authorizing Users

**Callback URL:**
```
http://localhost:3001/api/auth/github/callback
```
*(For production, use your deployed backend URL: `https://api.powr.xyz/api/auth/github/callback`)*

**Expire user authorization tokens:**
✅ **Check this box** - This provides refresh tokens for long-term access

**Request user authorization (OAuth) during installation:**
✅ **Check this box** - Required to identify the user and access their repositories

**Enable Device Flow:**
❌ **Leave unchecked** - Not needed for web app

### Post Installation

**Setup URL (optional):**
```
http://localhost:3000/dashboard
```
*(For production: `https://powr.xyz/dashboard`)*

**Redirect on update:**
✅ **Check this box** - Redirect users after repository changes

### Webhook

**Active:**
❌ **Leave unchecked for MVP** - Webhooks are optional for initial version

*(If you want to enable later for real-time updates:)*
- **Webhook URL:** `https://api.powr.xyz/api/webhooks/github`
- **Secret:** Generate a secure random string (store in `.env` as `GITHUB_WEBHOOK_SECRET`)

### Permissions

#### Repository Permissions

**Contents:**
- **Read** ✅ - To analyze repository structure and files

**Metadata:**
- **Read-only** ✅ - To access repository metadata (stars, forks, etc.)

**Pull requests:**
- **Read** ✅ - To analyze PRs, reviews, and merge status

**Issues:**
- **Read** ✅ - To analyze issue creation and resolution

**Commit statuses:**
- **Read** ✅ - To understand CI/CD integration

**Repository administration:**
- **No access** ❌

**Single file:**
- **No access** ❌

#### Account Permissions

**Email addresses:**
- **Read-only** ✅ - To identify user (optional, can be removed if privacy is a concern)

**Profile:**
- **Read-only** ✅ - To display user profile information

### Subscribe to Events

Based on the permissions selected, subscribe to:

✅ **Pull request** - Track PR activity
✅ **Push** - Track commit activity
✅ **Repository** - Track repository creation/updates
✅ **Public** - Track when repositories become public

### Installation Target

**Where can this GitHub App be installed?**

Select: **Any account** ✅

This allows:
- Individual developers to install the app
- Organizations to install for their teams
- Maximum adoption potential

---

## After Registration

Once you've registered the GitHub App, you'll receive:

1. **App ID** - Add to `.env` as `GITHUB_APP_ID`
2. **Client ID** - Add to `.env` as `GITHUB_CLIENT_ID`
3. **Client Secret** - Add to `.env` as `GITHUB_CLIENT_SECRET`
4. **Private Key** - Download and store securely (for advanced features)

### Update Backend Environment Variables

Add to `backend/.env`:
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
```

### Update Frontend (if needed)

The frontend redirects to the backend OAuth endpoint, which is already configured in:
- `frontend/app/auth/page.tsx` - Points to `http://localhost:3001/api/auth/github`
- `frontend/app/components/auth/GitHubButton.tsx` - Same endpoint

---

## Testing the OAuth Flow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Visit: `http://localhost:3000/auth`
4. Click "Continue with GitHub"
5. Authorize the app
6. You'll be redirected back with an access token

---

## Production Considerations

For production deployment:

1. **Update Callback URL** to your production backend URL
2. **Update Homepage URL** to your production frontend URL
3. **Update Setup URL** to your production dashboard URL
4. **Enable Webhooks** if you want real-time updates
5. **Set up proper secret management** for webhook verification
6. **Consider rate limiting** for API calls
7. **Add error handling** for OAuth failures

---

## Security Notes

- Never commit `.env` files with secrets
- Rotate secrets periodically
- Use HTTPS in production
- Validate webhook signatures if using webhooks
- Implement proper session management
- Consider using JWT tokens instead of passing access tokens directly

