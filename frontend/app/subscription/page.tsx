"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/layout/Sidebar";
import { PlanCard, Plan } from "../components/subscription/PlanCard";
import { PaymentFlow } from "../components/subscription/PaymentFlow";
import { apiClient } from "../lib/api";
import { X } from "phosphor-react";
import toast from "react-hot-toast";

// Default plans when API is unavailable
const defaultPlans: Plan[] = [
  {
    type: "free",
    name: "Free",
    price: 0,
    priceInCrypto: { eth: "0", usdc: "0" },
    updateFrequency: "Manual updates only",
    features: [
      "Basic PoW profile",
      "GitHub integration",
      "Manual proof anchoring",
      "Public profile page",
    ],
  },
  {
    type: "basic",
    name: "Basic",
    price: 9,
    priceInCrypto: { eth: "0.003", usdc: "9" },
    updateFrequency: "Weekly updates",
    features: [
      "Everything in Free",
      "Weekly automatic updates",
      "Skill percentile tracking",
      "Priority support",
      "Advanced analytics",
    ],
  },
  {
    type: "pro",
    name: "Pro",
    price: 29,
    priceInCrypto: { eth: "0.01", usdc: "29" },
    updateFrequency: "Daily updates",
    features: [
      "Everything in Basic",
      "Daily automatic updates",
      "Real-time notifications",
      "Custom profile badges",
      "API access",
      "Team collaboration",
      "Priority job matching",
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get username from localStorage (set by auth callback)
    const storedUsername = localStorage.getItem("github_username");
    const storedEmail = localStorage.getItem("github_email");

    if (!storedUsername) {
      router.push("/auth");
      return;
    }

    setUsername(storedUsername);
    setDisplayName(storedUsername);
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
    loadSubscriptionData(storedUsername);
  }, [router]);

  const loadSubscriptionData = async (user: string) => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        apiClient.getSubscriptionPlans().catch(() => ({ plans: defaultPlans })),
        apiClient.getCurrentSubscription(user).catch(() => ({ subscription: null, plan: null })),
      ]);

      if (plansData.plans && plansData.plans.length > 0) {
        setPlans(plansData.plans);
      }
      setCurrentSubscription(subscriptionData.subscription);
      setCurrentPlan(subscriptionData.subscription?.planType || "free");
    } catch (error) {
      console.error("Failed to load subscription data:", error);
      // Use default plans on error
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planType: string) => {
    if (planType === "free") {
      // Downgrade to free
      try {
        toast.loading("Downgrading to free plan...", { id: "downgrade" });
        await apiClient.upgradeSubscription(username, "free").catch(() => {
          // Mock success if API unavailable
          setCurrentPlan("free");
          setCurrentSubscription({ planType: "free", status: "active" });
        });
        toast.success("Downgraded to free plan successfully", { id: "downgrade" });
      } catch (error: any) {
        toast.error(`Failed to downgrade: ${error.message}`, { id: "downgrade" });
      }
      return;
    }

    // For paid plans, create payment intent
    try {
      toast.loading("Creating payment...", { id: "payment-intent" });
      const result = await apiClient.createPaymentIntent(username, planType, "eth");
      setPaymentIntent(result.paymentIntent);
      setSelectedPlan(planType);
      toast.success("Payment ready", { id: "payment-intent" });
    } catch (error: any) {
      // For demo purposes, show a mock payment flow
      toast.dismiss("payment-intent");
      const selectedPlanData = plans.find(p => p.type === planType);
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span className="font-medium">Upgrade to {selectedPlanData?.name}</span>
          <span className="text-sm text-gray-400">
            Price: ${selectedPlanData?.price}/month ({selectedPlanData?.priceInCrypto.eth} ETH)
          </span>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                setCurrentPlan(planType);
                setCurrentSubscription({ planType, status: "active" });
                toast.dismiss(t.id);
                toast.success(`Upgraded to ${selectedPlanData?.name} plan!`);
              }}
              className="px-3 py-1 bg-[#3b76ef] text-white text-sm rounded-lg"
            >
              Confirm (Demo)
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: 10000 });
    }
  };

  const handlePaymentVerified = async (txHash: string) => {
    try {
      toast.loading("Upgrading subscription...", { id: "upgrade" });
      await apiClient.upgradeSubscription(username, selectedPlan!, txHash);
      await loadSubscriptionData(username);
      setPaymentIntent(null);
      setSelectedPlan(null);
      toast.success("Subscription upgraded successfully!", { id: "upgrade" });
    } catch (error: any) {
      toast.error(`Failed to upgrade subscription: ${error.message}`, { id: "upgrade" });
    }
  };

  const handleCancelPayment = () => {
    setPaymentIntent(null);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex">
        <Sidebar 
          username={username} 
          email={userEmail || undefined}
          displayName={displayName}
        />
        <div className="flex-1 ml-60 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#3b76ef] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c0f] flex">
      <Sidebar 
        username={username} 
        email={userEmail || undefined}
        displayName={displayName}
      />
      <div className="flex-1 ml-60 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Subscription Plans</h1>
            <p className="text-gray-400">
              Choose a plan that fits your needs. All plans include onchain proof anchoring.
            </p>
          </div>

          {paymentIntent ? (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Complete Payment</h2>
                <button
                  onClick={handleCancelPayment}
                  className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" weight="bold" />
                </button>
              </div>
              <PaymentFlow
                paymentIntent={paymentIntent}
                onPaymentVerified={handlePaymentVerified}
                onCancel={handleCancelPayment}
              />
            </div>
          ) : (
            <>
              {currentSubscription && (
                <div className="mb-6 p-4 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Current Plan</p>
                      <p className="text-lg font-semibold text-white capitalize">
                        {currentSubscription.planType}
                      </p>
                      {currentSubscription.nextUpdateDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Next update: {new Date(currentSubscription.nextUpdateDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {currentSubscription.status === "active" && (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.type}
                    plan={plan}
                    currentPlan={currentPlan}
                    onSelect={handleSelectPlan}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

