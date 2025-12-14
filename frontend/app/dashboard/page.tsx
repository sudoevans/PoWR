"use client";

import { useEffect, useState } from "react";
import { PowIndexCard } from "../components/dashboard/PowIndexCard";
import { SkillPercentilePanel } from "../components/dashboard/SkillPercentilePanel";
import { ArtifactsSummary } from "../components/dashboard/ArtifactsSummary";
import { RecentWorkFeed } from "../components/dashboard/RecentWorkFeed";
import { OnChainProofs } from "../components/dashboard/OnChainProofs";
import { apiClient, PoWProfile, Artifact, Proof } from "../lib/api";
import { Button } from "../components/ui";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [profile, setProfile] = useState<PoWProfile | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // In a real app, get these from auth context or URL params
  const username = "octocat"; // Example
  const accessToken = ""; // Would come from auth

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      // For demo, we'll use mock data if no token
      if (!accessToken) {
        // Mock data for development
        setProfile({
          skills: [
            {
              skill: "Backend Engineering",
              score: 82,
              percentile: 12,
              confidence: 90,
              artifactCount: 45,
            },
            {
              skill: "Frontend Engineering",
              score: 65,
              percentile: 35,
              confidence: 75,
              artifactCount: 32,
            },
            {
              skill: "DevOps / Infrastructure",
              score: 45,
              percentile: 55,
              confidence: 60,
              artifactCount: 12,
            },
            {
              skill: "Systems / Architecture",
              score: 70,
              percentile: 30,
              confidence: 80,
              artifactCount: 28,
            },
          ],
          overallIndex: 65,
          artifactSummary: {
            repos: 15,
            commits: 234,
            pullRequests: 42,
            mergedPRs: 38,
          },
        });
        setArtifacts([]);
        setProofs([]);
      } else {
        const [profileData, artifactsData, proofsData] = await Promise.all([
          apiClient.getUserProfile(username, accessToken),
          apiClient.getUserArtifacts(username, accessToken),
          apiClient.getProofs(username),
        ]);
        setProfile(profileData);
        setArtifacts(artifactsData.artifacts);
        setProofs(proofsData.proofs);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!accessToken) {
      alert("Please connect your GitHub account first");
      return;
    }

    try {
      setAnalyzing(true);
      const result = await apiClient.triggerAnalysis(username, accessToken, 12);
      setProfile(result.profile);
      await loadDashboard();
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze artifacts");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your PoW profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No profile found</p>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Generate Profile"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Proof-of-Work Dashboard
            </h1>
            <p className="text-gray-400">
              Verifiable evidence of your development work
            </p>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "Analyzing..." : "Refresh Analysis"}
          </Button>
        </div>

        {/* PoW Index Card */}
        <PowIndexCard overallIndex={profile.overallIndex} />

        {/* Artifacts Summary */}
        <ArtifactsSummary
          repos={profile.artifactSummary.repos}
          commits={profile.artifactSummary.commits}
          pullRequests={profile.artifactSummary.pullRequests}
          mergedPRs={profile.artifactSummary.mergedPRs}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skill Percentile Panel */}
          <SkillPercentilePanel skills={profile.skills} />

          {/* Recent Work Feed */}
          <RecentWorkFeed artifacts={artifacts} limit={10} />
        </div>

        {/* On-Chain Proofs */}
        <OnChainProofs proofs={proofs} />
      </div>
    </div>
  );
}

