import { ethers } from 'ethers';
import * as snarkjs from 'snarkjs';

// ─── ABI ─────────────────────────────────────────────────────────────────────
// DungeonGate contract interface — only the functions we need from the frontend
const DUNGEONGATE_ABI = [
    // Core proof submission function
    "function clearDungeon(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals) external",
    // Read functions
    "function hasClearedDungeon(address) external view returns (bool)",
    "function clearedAt(address) external view returns (uint256)",
    "function getClearanceStatus(address) external view returns (bool, uint256)",
    "function treasureX() external view returns (uint256)",
    "function treasureY() external view returns (uint256)",
    "function checkClearance(address) external view returns (bool)",
    // Events
    "event DungeonCleared(address indexed player, uint256 startX, uint256 startY, uint256 treasureX, uint256 treasureY, uint256 timestamp)",
];

// Fallback public Sepolia RPC
const FALLBACK_RPC = 'https://sepolia.drpc.org';

/**
 * Get a JsonRpcProvider using our configured RPC URL.
 * Using a direct RPC avoids MetaMask's public RPC rate-limiting.
 */
function getJsonProvider() {
    const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || FALLBACK_RPC;
    return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Connect MetaMask and return the user's address.
 * MetaMask is used only for account access and transaction signing — NOT for RPC calls.
 *
 * @returns {Promise<string>} Connected wallet address
 */
export async function connectWallet() {
    if (!window.ethereum) {
        throw new Error('MetaMask bulunamadı! Lütfen MetaMask yükleyin.');
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
}

/**
 * Submit the ZK dungeon proof on-chain via DungeonGate contract.
 *
 * SUCCINCTNESS IN ACTION:
 *   - The 100-step path was computed off-chain in O(n) time.
 *   - This transaction submits only a fixed-size 3-point proof.
 *   - On-chain verification is O(1) — constant gas, constant time.
 *
 * @param {object}   proof         Groth16 proof object from snarkjs
 * @param {string[]} publicSignals Public signals [startX, startY, treasureX, treasureY]
 * @returns {Promise<{txHash: string, cleared: boolean}>}
 */
export async function submitDungeonProof(proof, publicSignals) {
    const contractAddress = import.meta.env.VITE_DUNGEON_ADDRESS;
    if (!contractAddress) {
        throw new Error('VITE_DUNGEON_ADDRESS ortam değişkeni tanımlı değil. Önce deploy edin.');
    }

    // 1. Request MetaMask account access
    const userAddress = await connectWallet();

    // 2. Force Sepolia network (chainId 0xaa36a7 = 11155111)
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0xaa36a7',
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [import.meta.env.VITE_SEPOLIA_RPC_URL || FALLBACK_RPC],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                }],
            });
        } else {
            throw switchError;
        }
    }

    // 3. Format proof as Solidity calldata
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const [pA, pB, pC, pubSignals] = JSON.parse(`[${calldata}]`);

    // 4. Encode function call
    const iface = new ethers.Interface(DUNGEONGATE_ABI);
    const data = iface.encodeFunctionData('clearDungeon', [pA, pB, pC, pubSignals]);

    // 5. Use direct RPC for gas estimation and fee data (avoids MetaMask rate limits)
    const provider = getJsonProvider();
    const [gasLimit, feeData, nonce, network] = await Promise.all([
        provider.estimateGas({ from: userAddress, to: contractAddress, data }),
        provider.getFeeData(),
        provider.getTransactionCount(userAddress, 'pending'),
        provider.getNetwork(),
    ]);

    // 20% gas buffer for safety
    const safeGasLimit = gasLimit * 120n / 100n;

    // 6. Build EIP-1559 transaction — MetaMask signs and broadcasts
    const txParams = {
        from: userAddress,
        to: contractAddress,
        data,
        gas: ethers.toBeHex(safeGasLimit),
        maxFeePerGas: ethers.toBeHex(feeData.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(feeData.maxPriorityFeePerGas),
        nonce: ethers.toBeHex(nonce),
        chainId: ethers.toBeHex(network.chainId),
        type: '0x2',
    };

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
    });

    // 7. Wait for confirmation using direct RPC
    const receipt = await provider.waitForTransaction(txHash, 1, 120_000);
    if (!receipt || receipt.status === 0) {
        throw new Error('İşlem başarısız oldu (kontrat revert).');
    }

    // 8. Read clearance status
    const clearedData = await provider.call({
        to: contractAddress,
        data: iface.encodeFunctionData('hasClearedDungeon', [userAddress]),
    });
    const cleared = BigInt(clearedData) === 1n;

    return { txHash: receipt.hash, cleared };
}

/**
 * Check if a player has already cleared the dungeon on-chain.
 *
 * @param {string} address Wallet address to check
 * @returns {Promise<{cleared: boolean, timestamp: number}>}
 */
export async function checkDungeonStatus(address) {
    const contractAddress = import.meta.env.VITE_DUNGEON_ADDRESS;
    if (!contractAddress) return { cleared: false, timestamp: 0 };

    try {
        const provider = getJsonProvider();
        const contract = new ethers.Contract(contractAddress, DUNGEONGATE_ABI, provider);
        const [cleared, timestamp] = await contract.getClearanceStatus(address);
        return { cleared, timestamp: Number(timestamp) };
    } catch {
        return { cleared: false, timestamp: 0 };
    }
}
