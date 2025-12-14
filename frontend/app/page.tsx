"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page (in production, check if user is logged in)
    router.push("/auth");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
