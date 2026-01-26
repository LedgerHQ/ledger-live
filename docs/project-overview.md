# Ledger Live - Project Overview

> **Generated:** 2026-01-23 | **Scan Level:** Exhaustive | **Mode:** Initial Scan

## Executive Summary

**Ledger Live** is a comprehensive **monorepository** containing the JavaScript ecosystem for Ledger hardware wallet applications. It provides secure gateway access to crypto assets, NFTs, and DeFi services through desktop and mobile applications.

## Project Identity

| Property | Value |
|----------|-------|
| **Name** | `@ledgerhq/ledger-live` |
| **Repository Type** | Monorepo (pnpm workspaces + Turborepo) |
| **License** | MIT / Apache-2.0 |
| **Primary Languages** | TypeScript, JavaScript |
| **Package Manager** | pnpm 10.24.0 |

## Repository Structure

```
ledger-live/
├── apps/                    # User-facing applications
│   ├── ledger-live-desktop/ # Electron desktop app (v2.137.0)
│   ├── ledger-live-mobile/  # React Native mobile app (v3.102.0)
│   ├── cli/                 # Command-line interface
│   └── web-tools/           # Developer web tools
├── libs/                    # Shared libraries
│   ├── ledger-live-common/  # Core business logic
│   ├── ledgerjs/            # Hardware wallet JS SDK
│   ├── coin-modules/        # Blockchain integrations (30 coins)
│   ├── ui/                  # Design system
│   └── ledger-services/     # Backend service clients
├── e2e/                     # End-to-end tests
├── tools/                   # Build and CI tooling
└── docs/                    # Project documentation
```

## Parts Overview

### Applications (4)

| Part | Type | Version | Files | Description |
|------|------|---------|-------|-------------|
| **ledger-live-desktop** | Desktop (Electron) | 2.137.0 | 3,039 | Cross-platform desktop wallet |
| **ledger-live-mobile** | Mobile (React Native) | 3.102.0 | 3,208 | iOS/Android mobile wallet |
| **cli** | CLI | 24.31.0 | 80 | Command-line interface |
| **web-tools** | Web | - | 83 | Developer debugging tools |

### Core Libraries (5)

| Part | Type | Files | Description |
|------|------|-------|-------------|
| **ledger-live-common** | Library | 1,185 | Shared business logic, bridges, hooks |
| **ledgerjs** | Library | 650 | Hardware transport, hw-app-* modules |
| **coin-modules** | Library | 2,223 | 30 blockchain integrations |
| **ui** | Library | 1,137 | Design system (react-ui, native-ui, icons) |
| **ledger-services** | Library | 34 | CAL and Trust service clients |

## Technology Stack

### Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Language | TypeScript | 5.4.3 |
| Build | Turborepo | 2.1.3 |
| Package Manager | pnpm | 10.24.0 |
| State Management | Redux Toolkit | catalog |
| Data Fetching | RTK Query | via dada-client |
| Validation | Zod | 3.22.4 |

### Desktop Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Electron | 39.2.7 |
| UI | React | 18.3.1 |
| Bundler | Rspack | 1.7.x |
| Styling | styled-components + Tailwind | 5.3.11 / 4.x |
| Testing | Jest + Playwright | catalog |

### Mobile Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React Native | 0.79.7 |
| UI | React | 19.0.0 |
| Navigation | React Navigation | 7.x |
| Styling | styled-components | 6.1.19 |
| Testing | Jest + Detox | catalog |

## Architecture Highlights

### MVVM Pattern Migration

Both desktop and mobile apps are actively migrating to an **MVVM (Model-View-ViewModel)** architecture:
- Desktop: 522 files in `src/mvvm/`
- Mobile: 620 files in `src/mvvm/`

### Families Pattern

Blockchain-specific UI logic is organized in `families/` directories:
- 25+ coin families per application
- Includes: Bitcoin, Ethereum/EVM, Solana, Cosmos, Polkadot, etc.

### Bridge Abstraction

The `bridge/` pattern provides a unified interface for:
- Account synchronization
- Transaction building
- Hardware signing

### Service Clients

RTK Query-based clients for backend services:
- **dada-client**: Dynamic Assets Data Aggregator
- **cal-client**: Crypto Assets List service
- **cmc-client**: CoinMarketCap integration

## Getting Started

### Prerequisites

- Node.js (via `proto` toolchain)
- pnpm 10.24.0
- Ruby 3.3.x (for mobile builds)

### Installation

```bash
# Clone repository
git clone git@github.com:LedgerHQ/ledger-live.git
cd ledger-live

# Install proto toolchain
proto use

# Install dependencies
pnpm i
```

### Development

```bash
# Desktop development
pnpm dev:lld

# Mobile development
pnpm dev:llm

# Build all libraries
pnpm build:libs
```

## Links

- **GitHub**: https://github.com/LedgerHQ/ledger-live
- **Developer Portal**: https://developers.ledger.com
- **Wiki**: https://github.com/LedgerHQ/ledger-live/wiki
