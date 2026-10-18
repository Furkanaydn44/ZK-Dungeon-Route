const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Update a key=value pair in the .env file.
 * If the key exists, updates it. Otherwise appends it.
 */
function updateEnv(key, value) {
    const envPath = path.resolve(__dirname, "../.env");
    let content = "";
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, "utf8");
    }
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
    } else {
        content += `\n${key}=${value}`;
    }
    fs.writeFileSync(envPath, content, "utf8");
}

async function main() {
    const network = hre.network.name;
    console.log(`🗡️  Deploying ZK-Dungeon Route contracts to [${network}]...\n`);

    // ─── Dungeon Configuration ───────────────────────────────────────────────
    // Treasure location — must match VITE_TREASURE_X / VITE_TREASURE_Y
    const TREASURE_X = 50n;
    const TREASURE_Y = 50n;

    // ─── 1. Deploy Groth16Verifier ───────────────────────────────────────────
    console.log("[1/2] Deploying Groth16Verifier (dungeonRoute circuit)...");
    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
    const verifierAddr = await verifier.getAddress();
    console.log(`  ✅ Verifier deployed: ${verifierAddr}\n`);

    // ─── 2. Deploy DungeonGate ───────────────────────────────────────────────
    console.log(`[2/2] Deploying DungeonGate (treasure @ [${TREASURE_X}, ${TREASURE_Y}])...`);
    const DungeonGate = await hre.ethers.getContractFactory("DungeonGate");
    const dungeonGate = await DungeonGate.deploy(verifierAddr, TREASURE_X, TREASURE_Y);
    await dungeonGate.waitForDeployment();
    const dungeonGateAddr = await dungeonGate.getAddress();
    console.log(`  ✅ DungeonGate deployed: ${dungeonGateAddr}\n`);

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log("========================================");
    console.log("  Deployment Complete! 🏆");
    console.log("========================================");
    console.log(`  Network:     ${network}`);
    console.log(`  Verifier:    ${verifierAddr}`);
    console.log(`  DungeonGate: ${dungeonGateAddr}`);
    console.log(`  Treasure:    (${TREASURE_X}, ${TREASURE_Y})`);
    console.log("========================================\n");

    // ─── Auto-update .env ────────────────────────────────────────────────────
    try {
        updateEnv("VITE_DUNGEON_ADDRESS", dungeonGateAddr);
        updateEnv("VITE_VERIFIER_ADDRESS", verifierAddr);
        console.log("✅ .env dosyası otomatik güncellendi:");
        console.log(`   VITE_DUNGEON_ADDRESS=${dungeonGateAddr}`);
        console.log(`   VITE_VERIFIER_ADDRESS=${verifierAddr}`);
        console.log("\n💡 'npm run dev' ile uygulamayı başlatın.\n");
    } catch (err) {
        // .env update failed — print manual instructions
        console.log("⚠️  .env güncellenemedi. Manuel olarak ekleyin:");
        console.log(`VITE_DUNGEON_ADDRESS=${dungeonGateAddr}`);
        console.log(`VITE_VERIFIER_ADDRESS=${verifierAddr}`);
    }

    if (network === "sepolia") {
        console.log("🔍 Etherscan'da görüntüle:");
        console.log(`   Verifier:    https://sepolia.etherscan.io/address/${verifierAddr}`);
        console.log(`   DungeonGate: https://sepolia.etherscan.io/address/${dungeonGateAddr}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
