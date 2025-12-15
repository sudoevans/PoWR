import { ethers } from "ethers";
import { Artifact } from "./artifactIngestion";
import { PoWProfile } from "./scoringEngine";

// PoWRegistry Contract ABI (simplified)
const POW_REGISTRY_ABI = [
  "function anchorSnapshot(bytes32 artifactHash, uint256[] memory skillScores, address githubIdentity) external",
  "function getSnapshot(address user) external view returns (tuple(bytes32 artifactHash, uint256[] skillScores, address githubIdentity, uint256 timestamp, bool exists))",
  "function verifySnapshot(bytes32 hash) external view returns (bool)",
  "function getSkillScores(address user) external view returns (uint256[] memory)",
  "event SnapshotAnchored(address indexed user, bytes32 indexed artifactHash, uint256 timestamp)",
] as const;

// Contract address from deployment
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x8fb4fF2123E9a11fC027c494551794fc75e76980";

// Base Sepolia RPC URL
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

export interface BlockchainProof {
  transactionHash: string;
  artifactHash: string;
  blockNumber: number;
  timestamp: number;
  skillScores: number[];
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Initialize signer if private key is available
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, POW_REGISTRY_ABI, this.signer);
    }
  }

  /**
   * Generate a hash of the artifact set for on-chain anchoring
   * Uses keccak256 to create a deterministic hash
   */
  generateArtifactHash(artifacts: Artifact[]): string {
    // Create a deterministic representation of artifacts
    const artifactData = artifacts.map((artifact) => ({
      id: artifact.id,
      type: artifact.type,
      timestamp: artifact.timestamp,
      repository: artifact.repository,
    }));

    // Sort by ID for consistency
    artifactData.sort((a, b) => a.id.localeCompare(b.id));

    // Create hash using keccak256 (ethers utility)
    const dataString = JSON.stringify(artifactData);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(dataString));
    
    return hash;
  }

  /**
   * Extract skill scores from PoW profile
   */
  extractSkillScores(profile: PoWProfile): number[] {
    return profile.skills.map((skill) => Math.round(skill.score));
  }

  /**
   * Anchor a PoW snapshot to the blockchain
   * @param artifacts Array of artifacts that were analyzed
   * @param profile The generated PoW profile
   * @param userAddress Optional wallet address of the user (can be zero address)
   * @returns Transaction hash and proof details
   */
  async anchorSnapshot(
    artifacts: Artifact[],
    profile: PoWProfile,
    userAddress?: string
  ): Promise<BlockchainProof> {
    if (!this.contract || !this.signer) {
      throw new Error("Blockchain service not configured. Set BLOCKCHAIN_PRIVATE_KEY in .env");
    }

    // Generate artifact hash
    const artifactHash = this.generateArtifactHash(artifacts);

    // Extract skill scores
    const skillScores = this.extractSkillScores(profile);
    const skillScoresBigInt = skillScores.map((score) => BigInt(score));

    // Use zero address if no user address provided
    const githubIdentity = userAddress 
      ? ethers.getAddress(userAddress)
      : ethers.ZeroAddress;

    try {
      // Call the contract
      const tx = await this.contract.anchorSnapshot(
        artifactHash,
        skillScoresBigInt,
        githubIdentity
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error("Transaction receipt not found");
      }

      // Get block to get timestamp
      const block = await this.provider.getBlock(receipt.blockNumber);
      
      return {
        transactionHash: receipt.hash,
        artifactHash: artifactHash,
        blockNumber: receipt.blockNumber || 0,
        timestamp: block?.timestamp || Math.floor(Date.now() / 1000),
        skillScores,
      };
    } catch (error: any) {
      console.error("Blockchain anchoring error:", error);
      throw new Error(`Failed to anchor snapshot: ${error.message}`);
    }
  }

  /**
   * Get snapshot from blockchain for a user address
   */
  async getSnapshot(userAddress: string): Promise<any> {
    if (!this.contract) {
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, POW_REGISTRY_ABI, this.provider);
    }

    try {
      const snapshot = await this.contract.getSnapshot(userAddress);
      return {
        artifactHash: snapshot.artifactHash,
        skillScores: snapshot.skillScores.map((score: bigint) => Number(score)),
        githubIdentity: snapshot.githubIdentity,
        timestamp: Number(snapshot.timestamp),
        exists: snapshot.exists,
      };
    } catch (error: any) {
      console.error("Error fetching snapshot:", error);
      return null;
    }
  }

  /**
   * Verify if a hash has been anchored on-chain
   */
  async verifySnapshot(hash: string): Promise<boolean> {
    if (!this.contract) {
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, POW_REGISTRY_ABI, this.provider);
    }

    try {
      return await this.contract.verifySnapshot(hash);
    } catch (error: any) {
      console.error("Error verifying snapshot:", error);
      return false;
    }
  }

  /**
   * Check if blockchain service is configured
   */
  isConfigured(): boolean {
    return !!process.env.BLOCKCHAIN_PRIVATE_KEY && !!this.signer;
  }
}

export const blockchainService = new BlockchainService();

