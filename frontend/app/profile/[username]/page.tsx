"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PowIndexCard } from "../../components/dashboard/PowIndexCard";
import { SkillPercentilePanel } from "../../components/dashboard/SkillPercentilePanel";
import { ArtifactsSummary } from "../../components/dashboard/ArtifactsSummary";
import { RecentWorkFeed } from "../../components/dashboard/RecentWorkFeed";
import { OnChainProofs } from "../../components/dashboard/OnChainProofs";
import { Card } from "../../components/ui";
import { apiClient, PoWProfile, Artifact, Proof } from "../../lib/api";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PoWProfile | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // In production, fetch from public API endpoint
      // For now, use mock data
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
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
        <Card>
          <p className="text-gray-400 text-center py-8">
            Profile not found
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {username}
          </h1>
          <p className="text-gray-400">
            Public Proof-of-Work Profile
          </p>
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

