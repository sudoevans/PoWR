// PoWRegistry ABI (simplified - in production, generate from contract)
export const POW_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "artifactHash", type: "bytes32" },
      { internalType: "uint256[]", name: "skillScores", type: "uint256[]" },
      { internalType: "address", name: "githubIdentity", type: "address" },
    ],
    name: "anchorSnapshot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getSnapshot",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "artifactHash", type: "bytes32" },
          { internalType: "uint256[]", name: "skillScores", type: "uint256[]" },
          { internalType: "address", name: "githubIdentity", type: "address" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct PoWRegistry.Snapshot",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "hash", type: "bytes32" }],
    name: "verifySnapshot",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getSkillScores",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "bytes32", name: "artifactHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "SnapshotAnchored",
    type: "event",
  },
] as const;

// Contract address (set after deployment)
export const POW_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x8fb4fF2123E9a11fC027c494551794fc75e76980";

// Base Sepolia RPC URL
export const BASE_SEPOLIA_RPC = "https://sepolia.base.org";

// Helper function to generate artifact hash
export function generateArtifactHash(artifacts: any[]): string {
  // In production, use a proper hash function
  // For now, return a placeholder
  const artifactsString = JSON.stringify(artifacts);
  // This would use keccak256 in a real implementation
  return "0x" + artifactsString.slice(0, 64).padEnd(64, "0");
}

// Fetch on-chain snapshot for an address
export async function getOnChainSnapshot(address: string): Promise<{
  artifactHash: string;
  skillScores: number[];
  timestamp: number;
  exists: boolean;
} | null> {
  try {
    const response = await fetch(BASE_SEPOLIA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: POW_REGISTRY_ADDRESS,
            data: `0x6e9960c3000000000000000000000000${address.slice(2)}`, // getSnapshot(address)
          },
          "latest",
        ],
      }),
    });
    const data = await response.json();
    if (data.error || data.result === "0x") {
      return null;
    }
    // Parse the result (simplified - would need proper ABI decoding)
    return null; // Placeholder - proper implementation would decode the response
  } catch (error) {
    console.error("Error fetching on-chain snapshot:", error);
    return null;
  }
}

// Verify a hash on-chain
export async function verifyHashOnChain(hash: string): Promise<boolean> {
  try {
    const response = await fetch(BASE_SEPOLIA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: POW_REGISTRY_ADDRESS,
            data: `0x8e760afe${hash.slice(2)}`, // verifySnapshot(bytes32)
          },
          "latest",
        ],
      }),
    });
    const data = await response.json();
    if (data.error) {
      return false;
    }
    // Result is a boolean encoded as bytes32
    return data.result !== "0x0000000000000000000000000000000000000000000000000000000000000000";
  } catch (error) {
    console.error("Error verifying hash on-chain:", error);
    return false;
  }
}

