# Starting the PoWR Application

## Quick Start

### 1. Start the Backend Server

Open a terminal and run:
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 2. Start the Frontend Server

Open another terminal and run:
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## Testing

Once both servers are running:

1. **Frontend**: Open http://localhost:3000 in your browser
   - You should see the auth page
   - Click "Continue with GitHub" to test OAuth flow

2. **Backend Health Check**: Visit http://localhost:3001/health
   - Should return: `{"status":"ok"}`

3. **Dashboard**: After authentication, you'll be redirected to `/dashboard`
   - View your PoW profile with mock data

4. **Recruiter Dashboard**: Visit http://localhost:3000/recruiters
   - Browse candidate cards
   - Test search and filters
   - Compare candidates

5. **Public Profile**: Visit http://localhost:3000/profile/octocat
   - View a public profile (no auth required)

## Environment Variables

Make sure to set up your environment variables:

### Backend (.env)
- `GITHUB_CLIENT_ID` - Your GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - Your GitHub OAuth app secret
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - For AI analysis

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend URL (default: http://localhost:3001)

## Troubleshooting

- **Backend won't start**: Check if port 3001 is available
- **Frontend won't start**: Check if port 3000 is available
- **OAuth errors**: Verify GitHub OAuth credentials are set
- **API errors**: Ensure backend is running before frontend

## Next Steps

1. Set up GitHub OAuth app at https://github.com/settings/developers
2. Configure environment variables
3. Deploy smart contracts to Base Sepolia (optional)
4. Test the full flow with real GitHub data

