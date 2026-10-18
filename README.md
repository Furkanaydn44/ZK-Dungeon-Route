# ⚔️ ZK-Dungeon Route

**Prove you know a secret 100-step dungeon path — without revealing a single step.**
**Gizli 100 adımlık zindan rotanızı tek bir adım bile ifşa etmeden kanıtlayın.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Circom](https://img.shields.io/badge/Circom-2.0-orange)](https://docs.circom.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![SnarkJS](https://img.shields.io/badge/SnarkJS-Groth16-blue)](https://github.com/iden3/snarkjs)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

<p align="center">
  <a href="#-english">🇬🇧 English</a> &nbsp;|&nbsp;
  <a href="#-türkçe">🇹🇷 Türkçe</a>
</p>

---

<div id="-english"></div>

# 🇬🇧 English

## 📖 Overview

ZK-Dungeon Route is a **Zero-Knowledge Proof** application where players prove they know a valid 100-step path from a starting point to a treasure chest inside a dungeon — **without revealing any of the steps**. It uses **zk-SNARKs (Groth16)** to generate a compact cryptographic proof that is verifiable by anyone on the Ethereum blockchain, yet leaks absolutely zero information about the secret route.

### How It Works

```
Player (Prover)                              Verifier (Smart Contract)
───────────────                              ────────────────────────
 steps[100] = [E,E,S,S,...] (SECRET)
 startX, startY = (0, 0)   (PUBLIC)
 treasureX, treasureY = (50, 50) (PUBLIC)
         │
         ▼
 ┌──────────────────────────┐
 │  Circom Circuit           │
 │  Walk 100 steps from      │
 │  (0,0) using directions   │
 │  assert endpoint = (50,50)│
 └───────────┬──────────────┘
             │
             ▼
 ┌──────────────────────────┐
 │  Groth16 ZK Proof         │────────────► Verify proof on-chain ✓
 │  (steps[] never leave     │              (knows: path reaches treasure)
 │   the browser)            │              (doesn't know: the 100 steps)
 └──────────────────────────┘
```

### Key Privacy Guarantee

| Data                     | Visible to Verifier? |
| ------------------------ | -------------------- |
| 100-step path (route)    | ❌ Never revealed    |
| Intermediate positions   | ❌ Never revealed    |
| Path reaches treasure    | ✅ Proven true       |
| Start coordinates        | ✅ Public input      |
| Treasure coordinates     | ✅ Public input      |

---

## ✨ Features

- ⚔️ **Dungeon Pathfinding ZKP** — Prove route knowledge without revealing the 100 steps
- 🗺️ **Interactive Dungeon Map** — Canvas-based animated visualization with player, trail, and pulsating treasure
- 🔀 **Smart Path Generation** — Automatic path generation with Manhattan distance padding and Fisher-Yates shuffle
- 🌐 **In-Browser Proof Generation** — All ZK computation runs locally via WebAssembly (WASM)
- ⛓️ **On-Chain Verification** — Submit proofs to `DungeonGate.sol` on Ethereum Sepolia with O(1) gas cost
- 🦊 **MetaMask Integration** — Connect wallet, sign transactions, and record dungeon clearance on-chain
- 🧪 **Full Test Suite** — Circuit tests + Solidity contract tests
- 🎨 **Premium UI** — Glassmorphism dark theme with dungeon aesthetics and smooth animations

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                  │
│                                                               │
│  ┌────────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │ DungeonForm│──►│ pathGenerator│──►│ DungeonMap (Canvas)  │ │
│  │ startX/Y   │   │ 100-step path│   │ animated walkthrough │ │
│  │ treasureX/Y│   └──────────────┘   └─────────────────────┘ │
│  └─────┬──────┘                                               │
│        │           ┌──────────────┐   ┌─────────────────────┐ │
│        └──────────►│ SnarkJS      │──►│ ProofResult          │ │
│                    │ fullProve()  │   │ - Off-chain verify   │ │
│                    │ (WASM)       │   │ - On-chain verify    │ │
│                    └──────────────┘   └──────────┬──────────┘ │
└───────────────────────────────────────────────────┼───────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Ethereum (Sepolia)  │
                                         │                      │
                                         │  Verifier.sol        │
                                         │  DungeonGate.sol     │
                                         └──────────────────────┘
```

| Layer      | Technology   | Purpose                                         |
| ---------- | ------------ | ----------------------------------------------- |
| Circuit    | Circom 2.0   | Define 100-step path validity constraint         |
| Proof      | SnarkJS      | Generate Groth16 proof in the browser (WASM)     |
| Contracts  | Solidity     | On-chain proof verification + clearance record   |
| Frontend   | React + Vite | Dungeon map, proof generation UI                 |
| Blockchain | Ethereum     | Immutable dungeon clearance records              |

---

## 🔮 The Circuit: `dungeonRoute.circom`

The ZK circuit encodes a 100-step grid walk with four cardinal directions:

| Direction | Code | Movement   |
| --------- | ---- | ---------- |
| North     | 1    | Y − 1      |
| South     | 2    | Y + 1      |
| East      | 3    | X + 1      |
| West      | 4    | X − 1      |

**Constraints enforced:**
1. Each step is exactly one of {1, 2, 3, 4} (boolean decomposition + exclusivity)
2. Position is accumulated step-by-step: `posX[i+1] = posX[i] + dX[i]`
3. Final position must equal treasure: `posX[100] === treasureX`, `posY[100] === treasureY`

**Private inputs:** `steps[100]` (the secret route)
**Public inputs:** `startX`, `startY`, `treasureX`, `treasureY`

---

## 🚀 Getting Started

### Prerequisites

| Tool     | Version | Install                                                       |
| -------- | ------- | ------------------------------------------------------------- |
| Node.js  | ≥ 18    | [nodejs.org](https://nodejs.org/)                             |
| Circom   | 2.x     | [Circom Install](https://docs.circom.io/getting-started/installation/) |

### Installation

```bash
# Clone the repository
git clone https://github.com/Furkanaydn44/ZK-DungeonRoute.git
cd ZK-DungeonRoute

# Install dependencies
npm install
```

### Trusted Setup (Required once)

```powershell
# Run the automated setup script
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

This performs a full Groth16 trusted setup:

1. ✅ Compile `dungeonRoute.circom` → WASM + R1CS (~700 constraints for 100 steps)
2. ✅ Powers of Tau ceremony (Phase 1, pot14 = 16384 constraint capacity)
3. ✅ Circuit-specific Groth16 setup (Phase 2)
4. ✅ Export verification key (`verification_key.json`)
5. ✅ Generate Solidity verifier contract (`contracts/Verifier.sol`)
6. ✅ Copy artifacts to `public/zkproof/` for the frontend

### Run the Application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎮 Usage Flow

1. **Set Start Coordinates** — Choose your dungeon entry point (X, Y)
2. **View Treasure Location** — Locked by the smart contract at (50, 50)
3. **Generate Secret Path** — Click to auto-generate a valid 100-step route with padding
4. **Watch the Animation** — The dungeon map animates the path step by step
5. **Generate ZK Proof** — Groth16 proof is created entirely in your browser
6. **Verify On-Chain** — Submit to `DungeonGate.sol` via MetaMask to record clearance

> **Privacy Guarantee:** The 100-step route never leaves your browser. Only 3 elliptic curve points (the proof) are submitted to the blockchain.

---

## 🧪 Testing

### Circuit Tests

Tests the ZK circuit with valid and invalid dungeon path scenarios:

```bash
npm run test:circuit
```

### Solidity Contract Tests

```bash
npm run compile
npm run test:contracts
```

Tests `DungeonGate.sol` deployment, treasure coordinate validation, proof rejection with invalid data, and clearance state management.

---

## ⛓️ Blockchain Deployment

### 1. Configure Environment

Create a `.env` file in the project root:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_wallet_private_key
```

### 2. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

This deploys:
- **Groth16Verifier** — Auto-generated on-chain verifier for the dungeon circuit
- **DungeonGate** — Wrapper contract with treasure location (50, 50) and clearance tracking

The deploy script automatically updates your `.env` with the deployed addresses.

### 3. Deploy Locally (Hardhat)

```bash
npm run deploy:local
```

### Environment Variables

| Variable                | Description                          |
| ----------------------- | ------------------------------------ |
| `SEPOLIA_RPC_URL`       | Alchemy/Infura Sepolia RPC endpoint  |
| `PRIVATE_KEY`           | Deployer wallet private key          |
| `VITE_DUNGEON_ADDRESS`  | Deployed DungeonGate contract address|
| `VITE_VERIFIER_ADDRESS` | Deployed Verifier contract address   |
| `VITE_TREASURE_X`       | Treasure X coordinate (default: 50)  |
| `VITE_TREASURE_Y`       | Treasure Y coordinate (default: 50)  |
| `VITE_SEPOLIA_RPC_URL`  | Frontend RPC URL for read calls      |

---

## 📁 Project Structure

```
ZK-DungeonRoute/
├── circuits/
│   ├── dungeonRoute.circom        # ZK circuit: 100-step path validator
│   └── input_dungeon.json         # Sample circuit input for testing
├── contracts/
│   ├── DungeonGate.sol            # Main contract: proof verification + clearance
│   └── Verifier.sol               # Auto-generated Groth16 verifier (from snarkjs)
├── scripts/
│   ├── setup.ps1                  # Trusted setup automation (PowerShell)
│   └── deploy.cjs                 # Hardhat deployment script
├── src/
│   ├── components/
│   │   ├── DungeonForm.jsx        # Coordinate inputs + path generation
│   │   ├── DungeonMap.jsx         # Canvas-based dungeon visualization
│   │   └── ProofResult.jsx        # Proof display + on-chain submission
│   ├── utils/
│   │   ├── generateProof.js       # SnarkJS Groth16 proof generation
│   │   ├── verifyProof.js         # Off-chain proof verification
│   │   ├── pathGenerator.js       # 100-step path generation + validation
│   │   └── contractInteraction.js # MetaMask + DungeonGate interaction
│   ├── App.jsx                    # Main application + state management
│   ├── index.css                  # Design system (glassmorphism dark theme)
│   └── main.jsx                   # React entry point
├── test/
│   ├── circuit.test.mjs           # Circuit test suite (snarkjs)
│   └── agegate.test.cjs           # Solidity contract test suite (Hardhat)
├── public/
│   └── zkproof/                   # WASM + zkey + vkey (generated by setup)
├── hardhat.config.cjs             # Hardhat configuration
├── vite.config.js                 # Vite configuration
├── package.json
├── LICENSE                        # MIT License
└── README.md
```

---

## 🔧 Tech Stack

| Component          | Technology                  |
| ------------------ | --------------------------- |
| ZK Circuit         | Circom 2.0                  |
| Proof System       | Groth16 (via SnarkJS)       |
| Smart Contracts    | Solidity 0.8.24             |
| Contract Framework | Hardhat                     |
| Frontend           | React 18 + Vite             |
| Wallet             | MetaMask (ethers.js v6)     |
| Blockchain         | Ethereum (Sepolia testnet)  |
| Visualization      | HTML5 Canvas                |

---

## 📜 How It Works (Technical Deep Dive)

### 1. Path Generation (`pathGenerator.js`)

The path generator creates a valid 100-step route using this strategy:

1. Calculate Manhattan distance from start to treasure: `|dx| + |dy|`
2. Generate mandatory directional steps to cover the displacement
3. Pad remaining slots with neutral pairs (East + West cancel out) to reach exactly 100 steps
4. Shuffle all steps using Fisher-Yates for a natural-looking path

### 2. ZK Proof Generation (In-Browser)

```
User Input → Circuit Witness → Groth16 Proof
  steps[100]     ~700 constraints     3 EC points (~128 bytes)
  (private)      (computed locally)   (sent to chain)
```

- **O(n) computation** happens off-chain in the browser via WebAssembly
- **O(1) verification** happens on-chain with constant ~200K gas

### 3. On-Chain Verification (`DungeonGate.sol`)

The smart contract:
1. Validates treasure coordinates match the contract's immutable config
2. Calls the Groth16 verifier with the proof and public signals
3. Records clearance: `hasClearedDungeon[player] = true` with timestamp
4. Emits a `DungeonCleared` event

### ZK-SNARK Properties Demonstrated

| Property        | In This Project                                                   |
| --------------- | ----------------------------------------------------------------- |
| **Privacy**     | 100 steps stay in the browser — only 3 EC points are submitted    |
| **Succinctness**| Proof size is constant regardless of path length                  |
| **Soundness**   | Treasure coordinates are locked by the contract — can't be faked  |
| **Completeness**| Any valid 100-step path produces a verifiable proof               |

---

## ⚠️ Important Notes

> **Development Setup**: The trusted setup uses a simplified single-party ceremony suitable for development and learning. Production applications require a multi-party computation (MPC) ceremony with multiple independent contributors.

> **Circuit Scope**: The circuit validates that 100 steps from start reach the treasure using cardinal directions. It does not enforce wall collisions, bounds checking, or uniqueness — it's designed as a ZKP educational demonstration.

---

## 📋 Available Scripts

| Script                   | Command                  | Description                              |
| ------------------------ | ------------------------ | ---------------------------------------- |
| Dev Server               | `npm run dev`            | Start Vite dev server                    |
| Build                    | `npm run build`          | Production build                         |
| Preview                  | `npm run preview`        | Preview production build                 |
| Compile Circuit          | `npm run compile-circuit`| Compile Circom circuit                   |
| Trusted Setup            | `npm run setup`          | Full Groth16 trusted setup               |
| Compile Contracts        | `npm run compile`        | Compile Solidity contracts               |
| Test Circuit             | `npm run test:circuit`   | Run ZK circuit tests                     |
| Test Contracts           | `npm run test:contracts` | Run Solidity contract tests              |
| Deploy (Sepolia)         | `npm run deploy:sepolia` | Deploy to Sepolia testnet                |
| Deploy (Local)           | `npm run deploy:local`   | Deploy to local Hardhat network          |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with ❤️ using Circom, SnarkJS, Solidity, and React
</p>

---
---

<div id="-türkçe"></div>

# 🇹🇷 Türkçe

## 📖 Genel Bakış

ZK-Dungeon Route, oyuncuların zindan içinde bir başlangıç noktasından hazine sandığına giden geçerli bir 100 adımlık rotayı bildiklerini — **hiçbir adımı ifşa etmeden** — kanıtladıkları bir **Zero-Knowledge Proof** uygulamasıdır. Ethereum blokzincirinde herkes tarafından doğrulanabilir, ancak gizli rota hakkında kesinlikle sıfır bilgi sızdıran kompakt bir kriptografik kanıt üretmek için **zk-SNARKs (Groth16)** teknolojisini kullanır.

### Nasıl Çalışır?

```
Oyuncu (Kanıtlayan)                          Doğrulayan (Akıllı Kontrat)
───────────────────                          ──────────────────────────
 steps[100] = [D,D,G,G,...] (GİZLİ)
 başlangıçX, başlangıçY = (0, 0)   (AÇIK)
 hazineX, hazineY = (50, 50)        (AÇIK)
         │
         ▼
 ┌──────────────────────────┐
 │  Circom Devresi           │
 │  (0,0)'dan 100 adım yürü  │
 │  yönleri kullanarak       │
 │  assert bitiş = (50,50)   │
 └───────────┬──────────────┘
             │
             ▼
 ┌──────────────────────────┐
 │  Groth16 ZK Kanıtı        │────────────► On-chain kanıt doğrula ✓
 │  (steps[] asla tarayıcıyı │              (biliyor: rota hazineye ulaşıyor)
 │   terk etmez)             │              (bilmiyor: 100 adımın kendisi)
 └──────────────────────────┘
```

### Temel Gizlilik Garantisi

| Veri                         | Doğrulayanda Görünür mü? |
| ---------------------------- | ------------------------- |
| 100 adımlık rota             | ❌ Asla açıklanmaz       |
| Ara pozisyonlar              | ❌ Asla açıklanmaz       |
| Rota hazineye ulaşıyor       | ✅ Kanıtlanmış doğru     |
| Başlangıç koordinatları      | ✅ Açık girdi            |
| Hazine koordinatları         | ✅ Açık girdi            |

---

## ✨ Özellikler

- ⚔️ **Zindan Rota ZKP** — 100 adımı ifşa etmeden rota bilgisini kanıtla
- 🗺️ **İnteraktif Zindan Haritası** — Canvas tabanlı animasyonlu görselleştirme: oyuncu, iz ve titreşen hazine
- 🔀 **Akıllı Rota Üretimi** — Manhattan mesafe dolgulama ve Fisher-Yates karıştırma ile otomatik rota oluşturma
- 🌐 **Tarayıcıda Kanıt Üretimi** — Tüm ZK hesaplaması WebAssembly (WASM) ile yerel olarak çalışır
- ⛓️ **On-Chain Doğrulama** — Kanıtları `DungeonGate.sol` üzerinden Ethereum Sepolia'ya O(1) gas maliyetiyle gönder
- 🦊 **MetaMask Entegrasyonu** — Cüzdan bağla, işlem imzala ve zindan temizleme kaydını on-chain oluştur
- 🧪 **Kapsamlı Test Paketi** — Devre testleri + Solidity kontrat testleri
- 🎨 **Premium Arayüz** — Glassmorphism karanlık tema, zindan estetiği ve akıcı animasyonlar

---

## 🏗️ Mimari

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                     │
│                                                               │
│  ┌────────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │ DungeonForm│──►│ pathGenerator│──►│ DungeonMap (Canvas)  │ │
│  │ başlangıç  │   │ 100 adımlık  │   │ animasyonlu yürüyüş │ │
│  │ koordinat  │   │ rota         │   └─────────────────────┘ │
│  └─────┬──────┘   └──────────────┘                            │
│        │           ┌──────────────┐   ┌─────────────────────┐ │
│        └──────────►│ SnarkJS      │──►│ ProofResult          │ │
│                    │ fullProve()  │   │ - Off-chain doğr.    │ │
│                    │ (WASM)       │   │ - On-chain doğr.     │ │
│                    └──────────────┘   └──────────┬──────────┘ │
└───────────────────────────────────────────────────┼───────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Ethereum (Sepolia)  │
                                         │                      │
                                         │  Verifier.sol        │
                                         │  DungeonGate.sol     │
                                         └──────────────────────┘
```

| Katman      | Teknoloji     | Amaç                                             |
| ----------- | ------------- | ------------------------------------------------ |
| Devre       | Circom 2.0    | 100 adımlık rota geçerlilik kısıtlaması tanımla  |
| Kanıt       | SnarkJS       | Tarayıcıda Groth16 kanıtı üret (WASM)            |
| Kontratlar  | Solidity      | On-chain kanıt doğrulama + temizleme kaydı       |
| Frontend    | React + Vite  | Zindan haritası, kanıt üretim arayüzü            |
| Blockchain  | Ethereum      | Değiştirilemez zindan temizleme kayıtları         |

---

## 🔮 Devre: `dungeonRoute.circom`

ZK devresi, dört ana yönle 100 adımlık bir ızgara yürüyüşünü kodlar:

| Yön    | Kod | Hareket   |
| ------ | --- | --------- |
| Kuzey  | 1   | Y − 1     |
| Güney  | 2   | Y + 1     |
| Doğu   | 3   | X + 1     |
| Batı   | 4   | X − 1     |

**Zorunlu kısıtlamalar:**
1. Her adım tam olarak {1, 2, 3, 4} değerlerinden biridir (boolean ayrıştırma + münhasırlık)
2. Pozisyon adım adım biriktirilir: `posX[i+1] = posX[i] + dX[i]`
3. Son pozisyon hazineye eşit olmalıdır: `posX[100] === treasureX`, `posY[100] === treasureY`

**Gizli girdiler:** `steps[100]` (gizli rota)
**Açık girdiler:** `startX`, `startY`, `treasureX`, `treasureY`

---

## 🚀 Başlarken

### Gereksinimler

| Araç     | Sürüm | Kurulum                                                       |
| -------- | ----- | ------------------------------------------------------------- |
| Node.js  | ≥ 18  | [nodejs.org](https://nodejs.org/)                             |
| Circom   | 2.x   | [Circom Kurulum](https://docs.circom.io/getting-started/installation/) |

### Kurulum

```bash
# Depoyu klonla
git clone https://github.com/Furkanaydn44/ZK-DungeonRoute.git
cd ZK-DungeonRoute

# Bağımlılıkları yükle
npm install
```

### Güvenilir Kurulum (Bir kez yapılır)

```powershell
# Otomatik kurulum scriptini çalıştır
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

Bu işlem tam bir Groth16 güvenilir kurulumu gerçekleştirir:

1. ✅ `dungeonRoute.circom` derlenir → WASM + R1CS (~700 kısıtlama, 100 adım)
2. ✅ Powers of Tau töreni (Faz 1, pot14 = 16384 kısıtlama kapasitesi)
3. ✅ Devreye özgü Groth16 kurulumu (Faz 2)
4. ✅ Doğrulama anahtarı dışa aktarılır (`verification_key.json`)
5. ✅ Solidity doğrulayıcı kontratı oluşturulur (`contracts/Verifier.sol`)
6. ✅ Yapıtlar frontend için `public/zkproof/` klasörüne kopyalanır

### Uygulamayı Çalıştır

```bash
npm run dev
```

Tarayıcında [http://localhost:5173](http://localhost:5173) adresini aç.

---

## 🎮 Kullanım Akışı

1. **Başlangıç Koordinatlarını Ayarla** — Zindan giriş noktanızı seçin (X, Y)
2. **Hazine Konumunu Görüntüle** — Akıllı kontrat tarafından (50, 50) olarak sabitlenmiştir
3. **Gizli Rota Üret** — Dolgulama ile geçerli 100 adımlık rotayı otomatik oluşturun
4. **Animasyonu İzle** — Zindan haritası rotayı adım adım canlandırır
5. **ZK Kanıtı Oluştur** — Groth16 kanıtı tamamen tarayıcınızda üretilir
6. **On-Chain Doğrula** — MetaMask ile `DungeonGate.sol`'a göndererek temizleme kaydı oluşturun

> **Gizlilik Garantisi:** 100 adımlık rota asla tarayıcınızdan çıkmaz. Blokzincire yalnızca 3 eliptik eğri noktası (kanıt) gönderilir.

---

## 🧪 Testler

### Devre Testleri

ZK devresini geçerli ve geçersiz zindan rota senaryolarıyla test eder:

```bash
npm run test:circuit
```

### Solidity Kontrat Testleri

```bash
npm run compile
npm run test:contracts
```

`DungeonGate.sol` deploy işlemi, hazine koordinat doğrulaması, geçersiz verilerle kanıt reddi ve temizleme durumu yönetimini test eder.

---

## ⛓️ Blockchain Deployment

### 1. Ortam Değişkenlerini Yapılandır

Proje kök dizininde bir `.env` dosyası oluşturun:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/API_ANAHTARINIZ
PRIVATE_KEY=cüzdan_private_key
```

### 2. Sepolia'ya Deploy Et

```bash
npm run deploy:sepolia
```

Bu işlem şunları deploy eder:
- **Groth16Verifier** — Zindan devresi için otomatik oluşturulmuş on-chain doğrulayıcı
- **DungeonGate** — Hazine konumu (50, 50) ve temizleme takibi ile sarmalayıcı kontrat

Deploy scripti, deploy edilen adresleri otomatik olarak `.env` dosyanıza yazar.

### 3. Yerel Deploy (Hardhat)

```bash
npm run deploy:local
```

### Ortam Değişkenleri

| Değişken                | Açıklama                              |
| ----------------------- | ------------------------------------- |
| `SEPOLIA_RPC_URL`       | Alchemy/Infura Sepolia RPC uç noktası |
| `PRIVATE_KEY`           | Deploy eden cüzdan private key'i      |
| `VITE_DUNGEON_ADDRESS`  | Deploy edilmiş DungeonGate adresi     |
| `VITE_VERIFIER_ADDRESS` | Deploy edilmiş Verifier adresi        |
| `VITE_TREASURE_X`       | Hazine X koordinatı (varsayılan: 50)  |
| `VITE_TREASURE_Y`       | Hazine Y koordinatı (varsayılan: 50)  |
| `VITE_SEPOLIA_RPC_URL`  | Frontend okuma çağrıları için RPC URL |

---

## 📁 Proje Yapısı

```
ZK-DungeonRoute/
├── circuits/
│   ├── dungeonRoute.circom        # ZK devresi: 100 adımlık rota doğrulayıcı
│   └── input_dungeon.json         # Test için örnek devre girdisi
├── contracts/
│   ├── DungeonGate.sol            # Ana kontrat: kanıt doğrulama + temizleme kaydı
│   └── Verifier.sol               # Otomatik oluşturulmuş Groth16 doğrulayıcı (snarkjs)
├── scripts/
│   ├── setup.ps1                  # Güvenilir kurulum otomasyonu (PowerShell)
│   └── deploy.cjs                 # Hardhat deployment scripti
├── src/
│   ├── components/
│   │   ├── DungeonForm.jsx        # Koordinat girdileri + rota üretimi
│   │   ├── DungeonMap.jsx         # Canvas tabanlı zindan görselleştirmesi
│   │   └── ProofResult.jsx        # Kanıt gösterimi + on-chain gönderim
│   ├── utils/
│   │   ├── generateProof.js       # SnarkJS Groth16 kanıt üretimi
│   │   ├── verifyProof.js         # Off-chain kanıt doğrulama
│   │   ├── pathGenerator.js       # 100 adımlık rota üretimi + doğrulama
│   │   └── contractInteraction.js # MetaMask + DungeonGate etkileşimi
│   ├── App.jsx                    # Ana uygulama + durum yönetimi
│   ├── index.css                  # Tasarım sistemi (glassmorphism karanlık tema)
│   └── main.jsx                   # React giriş noktası
├── test/
│   ├── circuit.test.mjs           # Devre test paketi (snarkjs)
│   └── agegate.test.cjs           # Solidity kontrat test paketi (Hardhat)
├── public/
│   └── zkproof/                   # WASM + zkey + vkey (setup ile oluşturulur)
├── hardhat.config.cjs             # Hardhat yapılandırması
├── vite.config.js                 # Vite yapılandırması
├── package.json
├── LICENSE                        # MIT Lisansı
└── README.md
```

---

## 🔧 Teknoloji Yığını

| Bileşen             | Teknoloji                   |
| ------------------- | --------------------------- |
| ZK Devresi          | Circom 2.0                  |
| Kanıt Sistemi       | Groth16 (SnarkJS ile)       |
| Akıllı Kontratlar   | Solidity 0.8.24             |
| Kontrat Framework   | Hardhat                     |
| Frontend            | React 18 + Vite             |
| Cüzdan              | MetaMask (ethers.js v6)     |
| Blockchain          | Ethereum (Sepolia testnet)  |
| Görselleştirme      | HTML5 Canvas                |

---

## 📜 Nasıl Çalışır? (Teknik Detay)

### 1. Rota Üretimi (`pathGenerator.js`)

Rota üretici şu strateji ile geçerli bir 100 adımlık rota oluşturur:

1. Başlangıçtan hazineye Manhattan mesafesini hesapla: `|dx| + |dy|`
2. Yer değiştirmeyi karşılamak için zorunlu yön adımlarını oluştur
3. Tam 100 adıma ulaşmak için kalan yerleri nötr çiftlerle doldur (Doğu + Batı birbirini iptal eder)
4. Tüm adımları doğal görünümlü bir rota için Fisher-Yates ile karıştır

### 2. ZK Kanıt Üretimi (Tarayıcıda)

```
Kullanıcı Girdisi → Devre Tanığı → Groth16 Kanıtı
  steps[100]          ~700 kısıtlama   3 EC noktası (~128 byte)
  (gizli)             (yerel hesaplama) (zincire gönderilen)
```

- **O(n) hesaplama** tarayıcıda off-chain olarak WebAssembly ile gerçekleşir
- **O(1) doğrulama** on-chain'de sabit ~200K gas ile gerçekleşir

### 3. On-Chain Doğrulama (`DungeonGate.sol`)

Akıllı kontrat:
1. Hazine koordinatlarının kontratın değiştirilemez ayarlarıyla eşleştiğini doğrular
2. Groth16 doğrulayıcısını kanıt ve açık sinyallerle çağırır
3. Temizlemeyi kaydeder: `hasClearedDungeon[oyuncu] = true` + zaman damgası
4. `DungeonCleared` olayını yayınlar

### Gösterilen ZK-SNARK Özellikleri

| Özellik            | Bu Projede                                                        |
| ------------------ | ----------------------------------------------------------------- |
| **Gizlilik**       | 100 adım tarayıcıda kalır — yalnızca 3 EC noktası gönderilir     |
| **Özlülük**        | Kanıt boyutu rota uzunluğundan bağımsız olarak sabittir           |
| **Sağlamlık**      | Hazine koordinatları kontrat tarafından kilitlenir — sahte olamaz |
| **Tamlık**         | Geçerli herhangi bir 100 adımlık rota doğrulanabilir kanıt üretir |

---

## ⚠️ Önemli Notlar

> **Geliştirme Kurulumu**: Güvenilir kurulum, geliştirme ve öğrenme için uygun basitleştirilmiş tek taraflı bir tören kullanır. Üretim uygulamaları, birden fazla bağımsız katkıcı ile çok taraflı hesaplama (MPC) töreni gerektirir.

> **Devre Kapsamı**: Devre, 100 adımın başlangıçtan hazineye ana yönlerle ulaştığını doğrular. Duvar çarpışması, sınır kontrolü veya benzersizlik zorlamaz — bir ZKP eğitim gösterimi olarak tasarlanmıştır.

---

## 📋 Mevcut Komutlar

| Komut                    | Çalıştırma               | Açıklama                                 |
| ------------------------ | ------------------------- | ---------------------------------------- |
| Geliştirme Sunucusu      | `npm run dev`             | Vite dev sunucusunu başlat               |
| Derleme                  | `npm run build`           | Üretim derlemesi                         |
| Önizleme                 | `npm run preview`         | Üretim derlemesini önizle                |
| Devre Derleme            | `npm run compile-circuit` | Circom devresini derle                   |
| Güvenilir Kurulum        | `npm run setup`           | Tam Groth16 güvenilir kurulumu           |
| Kontrat Derleme          | `npm run compile`         | Solidity kontratlarını derle             |
| Devre Testi              | `npm run test:circuit`    | ZK devre testlerini çalıştır             |
| Kontrat Testi            | `npm run test:contracts`  | Solidity kontrat testlerini çalıştır     |
| Deploy (Sepolia)         | `npm run deploy:sepolia`  | Sepolia testnet'e deploy et              |
| Deploy (Yerel)           | `npm run deploy:local`    | Yerel Hardhat ağına deploy et            |

---

## 📄 Lisans

MIT Lisansı — ayrıntılar için [LICENSE](./LICENSE) dosyasına bakın.

---

<p align="center">
  Circom, SnarkJS, Solidity ve React ile ❤️ ile yapıldı
</p>
