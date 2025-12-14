// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PoWRegistry
 * @notice Registry for anchoring Proof-of-Work reputation snapshots on-chain
 */
contract PoWRegistry {
    struct Snapshot {
        bytes32 artifactHash;
        uint256[] skillScores;
        address githubIdentity;
        uint256 timestamp;
        bool exists;
    }

    mapping(address => Snapshot) public snapshots;
    mapping(bytes32 => bool) public verifiedHashes;

    event SnapshotAnchored(
        address indexed user,
        bytes32 indexed artifactHash,
        uint256 timestamp
    );

    /**
     * @notice Anchor a PoW snapshot on-chain
     * @param artifactHash Hash of the analyzed artifact set
     * @param skillScores Array of skill-specific PoW scores (0-100)
     * @param githubIdentity Address linked to GitHub identity (can be zero address)
     */
    function anchorSnapshot(
        bytes32 artifactHash,
        uint256[] memory skillScores,
        address githubIdentity
    ) external {
        require(artifactHash != bytes32(0), "Invalid artifact hash");
        require(skillScores.length > 0, "Skill scores required");

        // Validate skill scores are within range (0-100)
        for (uint256 i = 0; i < skillScores.length; i++) {
            require(skillScores[i] <= 100, "Invalid skill score");
        }

        Snapshot memory snapshot = Snapshot({
            artifactHash: artifactHash,
            skillScores: skillScores,
            githubIdentity: githubIdentity,
            timestamp: block.timestamp,
            exists: true
        });

        snapshots[msg.sender] = snapshot;
        verifiedHashes[artifactHash] = true;

        emit SnapshotAnchored(msg.sender, artifactHash, block.timestamp);
    }

    /**
     * @notice Get the latest snapshot for a user
     * @param user Address of the user
     * @return snapshot The user's snapshot
     */
    function getSnapshot(address user) external view returns (Snapshot memory) {
        require(snapshots[user].exists, "No snapshot found");
        return snapshots[user];
    }

    /**
     * @notice Verify if a hash has been anchored
     * @param hash The hash to verify
     * @return bool True if the hash has been verified
     */
    function verifySnapshot(bytes32 hash) external view returns (bool) {
        return verifiedHashes[hash];
    }

    /**
     * @notice Get skill scores for a user
     * @param user Address of the user
     * @return skillScores Array of skill scores
     */
    function getSkillScores(address user) external view returns (uint256[] memory) {
        require(snapshots[user].exists, "No snapshot found");
        return snapshots[user].skillScores;
    }
}

