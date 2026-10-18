// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



interface IDungeonVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals
    ) external view returns (bool);
}

contract DungeonGate {

    // ─── State ────────────────────────────────────────────────────────────────
    IDungeonVerifier public immutable verifier;

    /// @notice Records which wallets have successfully cleared the dungeon
    mapping(address => bool) public hasClearedDungeon;

    /// @notice Timestamp of when a player cleared the dungeon
    mapping(address => uint256) public clearedAt;

    /// @notice The dungeon's treasure location (set at deploy time)
    uint256 public immutable treasureX;
    uint256 public immutable treasureY;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a player proves they know a valid path to the treasure
    /// @param player   The wallet address of the successful prover
    /// @param startX   The X coordinate where the path began (public)
    /// @param startY   The Y coordinate where the path began (public)
    /// @param treasureX The X coordinate of the treasure (public)
    /// @param treasureY The Y coordinate of the treasure (public)
    /// @param timestamp Block timestamp of the proof submission
    event DungeonCleared(
        address indexed player,
        uint256 startX,
        uint256 startY,
        uint256 treasureX,
        uint256 treasureY,
        uint256 timestamp
    );

    /// @notice Emitted when a player's dungeon clearance is revoked (admin feature)
    event ClearanceRevoked(address indexed player, uint256 timestamp);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param _verifierAddress Address of the deployed Groth16Verifier contract
    /// @param _treasureX       X coordinate of the dungeon's treasure chest
    /// @param _treasureY       Y coordinate of the dungeon's treasure chest
    constructor(
        address _verifierAddress,
        uint256 _treasureX,
        uint256 _treasureY
    ) {
        verifier = IDungeonVerifier(_verifierAddress);
        treasureX = _treasureX;
        treasureY = _treasureY;
    }

    // ─── Core Function ────────────────────────────────────────────────────────

    /**
     * @notice Submit a ZK proof to clear the dungeon.
     *
     * @dev The proof encodes: "I know a 100-step path from (startX, startY)
     *      that arrives at (treasureX, treasureY)."
     *      The actual steps are NEVER submitted — only the cryptographic proof.
     *
     * @param _pA         Groth16 proof point A
     * @param _pB         Groth16 proof point B (2x2 matrix)
     * @param _pC         Groth16 proof point C
     * @param _pubSignals Public signals: [startX, startY, treasureX, treasureY]
     */
    function clearDungeon(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals
    ) external {

        // ── Guard 1: Verify treasure coordinates match contract config ─────────
        // The prover cannot claim to reach a different treasure location.
        require(
            _pubSignals[2] == treasureX,
            "DungeonGate: treasureX mismatch"
        );
        require(
            _pubSignals[3] == treasureY,
            "DungeonGate: treasureY mismatch"
        );

        // ── Guard 2: Cryptographic proof verification (O(1) constant cost) ─────
        // This single call verifies that the prover performed all 100 steps
        // correctly off-chain. Gas cost is fixed regardless of path length.
        bool proofValid = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(proofValid, "DungeonGate: invalid ZK proof");

        // ── Record clearance ──────────────────────────────────────────────────
        hasClearedDungeon[msg.sender] = true;
        clearedAt[msg.sender] = block.timestamp;

        // ── Emit event with public coordinates ────────────────────────────────
        emit DungeonCleared(
            msg.sender,
            _pubSignals[0],   // startX
            _pubSignals[1],   // startY
            _pubSignals[2],   // treasureX
            _pubSignals[3],   // treasureY
            block.timestamp
        );
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Check if a player has cleared the dungeon.
     * @param _player Wallet address to check
     * @return cleared True if the player has submitted a valid proof
     */
    function checkClearance(address _player) external view returns (bool cleared) {
        return hasClearedDungeon[_player];
    }

    /**
     * @notice Get the full clearance status for a player.
     * @param _player Wallet address to check
     * @return cleared   True if cleared
     * @return timestamp Unix timestamp when the dungeon was cleared (0 if not cleared)
     */
    function getClearanceStatus(address _player)
        external
        view
        returns (bool cleared, uint256 timestamp)
    {
        return (hasClearedDungeon[_player], clearedAt[_player]);
    }
}
