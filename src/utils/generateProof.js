import * as snarkjs from 'snarkjs';

/**
 * Generate a Groth16 ZK proof for the dungeon route.
 *
 * PRIVACY:      steps[100] stays in the browser — the proof reveals nothing about the path.
 * SUCCINCTNESS: The resulting proof is a fixed 3-point elliptic curve structure,
 *               regardless of how many steps were taken.
 *
 * @param {number[]} steps      Private: 100-element array of directions (1=N, 2=S, 3=E, 4=W)
 * @param {number}   startX     Public: dungeon start column
 * @param {number}   startY     Public: dungeon start row
 * @param {number}   treasureX  Public: treasure column
 * @param {number}   treasureY  Public: treasure row
 * @returns {Promise<{proof: object, publicSignals: string[]}>}
 */
export async function generateDungeonProof(steps, startX, startY, treasureX, treasureY) {
    // Build the circuit input object.
    // steps is PRIVATE — it will compute the witness but never leave the browser.
    const input = {
        steps:     steps.map(String),   // Circom expects string-encoded field elements
        startX:    String(startX),
        startY:    String(startY),
        treasureX: String(treasureX),
        treasureY: String(treasureY),
    };

    // snarkjs.groth16.fullProve:
    //   1. Loads the WASM circuit (WebAssembly compiled from dungeonRoute.circom)
    //   2. Computes the witness (all intermediate signals including the secret path)
    //   3. Generates the Groth16 proof — a succinct 3-point structure
    // All of this happens in the browser. The steps[] never leave.
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        '/zkproof/dungeonRoute.wasm',   // compiled WASM circuit
        '/zkproof/circuit_final.zkey'   // Groth16 proving key from trusted setup
    );

    return { proof, publicSignals };
}

/**
 * Format proof for Solidity DungeonGate.clearDungeon() calldata.
 *
 * publicSignals layout (from dungeonRoute.circom):
 *   [0] = startX
 *   [1] = startY
 *   [2] = treasureX
 *   [3] = treasureY
 *
 * @param {object}   proof         The Groth16 proof object
 * @param {string[]} publicSignals Public signals array
 * @returns {Promise<{pA: string[], pB: string[][], pC: string[], pubSignals: string[]}>}
 */
export async function formatCalldata(proof, publicSignals) {
    // snarkjs exports calldata as a JSON-like string that maps to Solidity types
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const [pA, pB, pC, pubSignals] = JSON.parse(`[${calldata}]`);
    return { pA, pB, pC, pubSignals };
}
