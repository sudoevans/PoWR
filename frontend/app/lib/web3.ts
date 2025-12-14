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
] as const;

// Contract address (set after deployment)
export const POW_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// Helper function to generate artifact hash
export function generateArtifactHash(artifacts: any[]): string {
  // In production, use a proper hash function
  // For now, return a placeholder
  const artifactsString = JSON.stringify(artifacts);
  // This would use keccak256 in a real implementation
  return "0x" + artifactsString.slice(0, 64).padEnd(64, "0");
}

