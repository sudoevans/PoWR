"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { createConfig, http, WagmiProvider } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#12141a",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

