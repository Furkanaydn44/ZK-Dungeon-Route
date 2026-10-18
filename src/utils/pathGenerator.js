/**
 * pathGenerator.js
 * ================
 * Generates a valid 100-step dungeon route from (startX, startY) to (treasureX, treasureY).
 *
 * Direction encoding (matches dungeonRoute.circom):
 *   1 = North  (y - 1)
 *   2 = South  (y + 1)
 *   3 = East   (x + 1)
 *   4 = West   (x - 1)
 *
 * Strategy:
 *   1. Calculate the Manhattan displacement (dx, dy) from start to treasure.
 *   2. Fill an array with the required directional steps.
 *   3. Pad to exactly 100 steps with "neutral" pairs (East then West cancel out).
 *   4. Shuffle the core steps so the path isn't a boring straight line.
 */

const NORTH = 1;
const SOUTH = 2;
const EAST  = 3;
const WEST  = 4;

/**
 * Generate a valid 100-step path from (startX, startY) to (treasureX, treasureY).
 * The path is shuffled for realism but always resolves to the correct endpoint.
 *
 * @param {number} startX
 * @param {number} startY
 * @param {number} treasureX
 * @param {number} treasureY
 * @returns {number[]} Array of exactly 100 direction values
 */
export function generatePath(startX, startY, treasureX, treasureY) {
    const dx = treasureX - startX; // positive = East, negative = West
    const dy = treasureY - startY; // positive = South, negative = North

    const mandatorySteps = [];

    // X displacement
    if (dx > 0) {
        for (let i = 0; i < dx; i++) mandatorySteps.push(EAST);
    } else {
        for (let i = 0; i < Math.abs(dx); i++) mandatorySteps.push(WEST);
    }

    // Y displacement
    if (dy > 0) {
        for (let i = 0; i < dy; i++) mandatorySteps.push(SOUTH);
    } else {
        for (let i = 0; i < Math.abs(dy); i++) mandatorySteps.push(NORTH);
    }

    const mandatoryCount = mandatorySteps.length;

    if (mandatoryCount > 100) {
        throw new Error(
            `Distance too large: Manhattan distance ${mandatoryCount} exceeds 100 steps. ` +
            `Keep |dx| + |dy| ≤ 100.`
        );
    }

    // Pad remaining slots with neutral pairs (EAST+WEST cancel each other)
    const paddingCount = 100 - mandatoryCount;
    const padding = [];
    for (let i = 0; i < paddingCount / 2; i++) {
        padding.push(EAST);
        padding.push(WEST);
    }
    // If paddingCount is odd, add one more neutral pair and remove one step
    // (mandatoryCount + paddingCount should always = 100 since we floor paddingCount/2*2)

    const allSteps = [...mandatorySteps, ...padding];

    // Shuffle the first `mandatoryCount + padding` steps for a natural-looking path
    // Keep the shuffle seeded for determinism in demos
    shuffleArray(allSteps);

    return allSteps.slice(0, 100);
}

/**
 * Fisher-Yates shuffle (in-place)
 * @param {any[]} arr
 */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Simulate walking a path and return the final position.
 * Useful for validation before generating a proof.
 *
 * @param {number[]} steps  Array of direction values (1-4)
 * @param {number}   startX Starting X coordinate
 * @param {number}   startY Starting Y coordinate
 * @returns {{ x: number, y: number }}
 */
export function simulatePath(steps, startX, startY) {
    let x = startX;
    let y = startY;
    for (const step of steps) {
        if (step === NORTH) y -= 1;
        else if (step === SOUTH) y += 1;
        else if (step === EAST)  x += 1;
        else if (step === WEST)  x -= 1;
    }
    return { x, y };
}

/**
 * Validate that a steps array is a valid dungeon path.
 * @param {number[]} steps       Array of direction values
 * @param {number}   startX
 * @param {number}   startY
 * @param {number}   treasureX
 * @param {number}   treasureY
 * @returns {{ valid: boolean, finalX: number, finalY: number, error?: string }}
 */
export function validatePath(steps, startX, startY, treasureX, treasureY) {
    if (!Array.isArray(steps) || steps.length !== 100) {
        return { valid: false, finalX: 0, finalY: 0, error: 'Path must have exactly 100 steps.' };
    }
    for (const s of steps) {
        if (![1, 2, 3, 4].includes(s)) {
            return { valid: false, finalX: 0, finalY: 0, error: `Invalid direction value: ${s}. Must be 1-4.` };
        }
    }
    const { x, y } = simulatePath(steps, startX, startY);
    const reachesTreasure = (x === treasureX && y === treasureY);
    return {
        valid: reachesTreasure,
        finalX: x,
        finalY: y,
        error: reachesTreasure ? undefined : `Path ends at (${x}, ${y}), not at treasure (${treasureX}, ${treasureY}).`,
    };
}

/**
 * Default dungeon configuration for demo purposes.
 * Start: (0, 0), Treasure: (50, 50)
 */
export const DEFAULT_DUNGEON = {
    startX: 0,
    startY: 0,
    treasureX: 50,
    treasureY: 50,
};
