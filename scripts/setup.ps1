# ZK-Dungeon Route Trusted Setup Script (PowerShell)
# ====================================================
# This script automates the full Groth16 trusted setup process
# for the 100-step DungeonRoute ZK circuit.
#
# Demonstrates SUCCINCTNESS: 100 steps → constant-size proof (3 elliptic curve points)
#
# Prerequisites:
#   - circom  (https://docs.circom.io/getting-started/installation/)
#   - snarkjs  (npm install -g snarkjs)
#   - Node.js

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  ZK-Dungeon Route Trusted Setup" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

# Create build directory
if (!(Test-Path "build")) { New-Item -ItemType Directory -Path "build" | Out-Null }

# ============================================
# Step 1: Compile the circuit
# ============================================
Write-Host "[1/6] Compiling dungeonRoute circuit..." -ForegroundColor Yellow
Write-Host "  -> 100-step walk: ~600+ constraints, proving succinctness..." -ForegroundColor Gray
circom circuits/dungeonRoute.circom --r1cs --wasm --sym -o build
Write-Host "  -> Circuit compiled successfully!" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 2: Powers of Tau ceremony (Phase 1)
# ============================================
# pot14 = 2^14 = 16384 constraints capacity
# dungeonRoute generates ~700 constraints (100 steps x ~7 constraints each)
# pot14 gives plenty of headroom
Write-Host "[2/6] Starting Powers of Tau ceremony (pot14)..." -ForegroundColor Yellow
Write-Host "  -> Using pot14 (16384 capacity) for 100-step circuit constraints" -ForegroundColor Gray
npx snarkjs powersoftau new bn128 14 build/pot14_0000.ptau -v
npx snarkjs powersoftau contribute build/pot14_0000.ptau build/pot14_0001.ptau `
    --name="ZK-Dungeon Dev Contribution" -v -e="dungeon entropy random seed for dev setup"
npx snarkjs powersoftau prepare phase2 build/pot14_0001.ptau build/pot14_final.ptau -v
Write-Host "  -> Powers of Tau complete!" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 3: Circuit-specific setup (Phase 2)
# ============================================
Write-Host "[3/6] Groth16 circuit-specific setup (dungeonRoute)..." -ForegroundColor Yellow
npx snarkjs groth16 setup build/dungeonRoute.r1cs build/pot14_final.ptau build/dungeonRoute_0000.zkey
npx snarkjs zkey contribute build/dungeonRoute_0000.zkey build/circuit_final.zkey `
    --name="ZK-Dungeon Dev" -v -e="more dungeon random entropy"
Write-Host "  -> Groth16 setup complete!" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 4: Export verification key
# ============================================
Write-Host "[4/6] Exporting verification key..." -ForegroundColor Yellow
npx snarkjs zkey export verificationkey build/circuit_final.zkey build/verification_key.json
Write-Host "  -> Verification key exported to build/verification_key.json" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 5: Export Solidity verifier
# ============================================
Write-Host "[5/6] Generating Solidity verifier contract..." -ForegroundColor Yellow
if (!(Test-Path "contracts")) { New-Item -ItemType Directory -Path "contracts" | Out-Null }
npx snarkjs zkey export solidityverifier build/circuit_final.zkey contracts/Verifier.sol
Write-Host "  -> contracts/Verifier.sol generated!" -ForegroundColor Green
Write-Host ""

# ============================================
# Step 6: Copy artifacts for frontend
# ============================================
Write-Host "[6/6] Copying artifacts to public/zkproof..." -ForegroundColor Yellow
$zkDir = "public/zkproof"
if (!(Test-Path $zkDir)) { New-Item -ItemType Directory -Path $zkDir -Force | Out-Null }

Copy-Item "build/dungeonRoute_js/dungeonRoute.wasm" "$zkDir/dungeonRoute.wasm" -Force
Copy-Item "build/circuit_final.zkey" "$zkDir/circuit_final.zkey" -Force
Copy-Item "build/verification_key.json" "$zkDir/verification_key.json" -Force
Write-Host "  -> Frontend artifacts ready in public/zkproof/" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "  Frontend files: public/zkproof/" -ForegroundColor Cyan
Write-Host "    - dungeonRoute.wasm" -ForegroundColor Cyan
Write-Host "    - circuit_final.zkey" -ForegroundColor Cyan
Write-Host "    - verification_key.json" -ForegroundColor Cyan
Write-Host "  Contract: contracts/Verifier.sol" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "  Next: npm run compile && npm run deploy:local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Magenta
