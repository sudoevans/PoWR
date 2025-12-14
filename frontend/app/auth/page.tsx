"use client";

import { Button } from "../components/ui";
import { Github } from "lucide-react";

export default function AuthPage() {
  const handleGitHubLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = "http://localhost:3001/api/auth/github";
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            PoWR
          </h1>
          <p className="text-gray-400">
            Proof of Work Reputation
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Verifiable, artifact-backed evidence of real work
          </p>
        </div>

        <div className="bg-[#141519] rounded-lg p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Sign in with GitHub
            </h2>
            <p className="text-sm text-gray-400">
              Connect your GitHub account to generate your Proof-of-Work profile
            </p>
          </div>

          <Button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Button>

          <p className="text-xs text-gray-500 text-center">
            We only request read access to your public repositories
          </p>
        </div>
      </div>
    </div>
  );
}

