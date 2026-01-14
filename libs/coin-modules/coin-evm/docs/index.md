# @ledgerhq/coin-evm Documentation Index

## Project Overview

- **Type:** TypeScript Library (monolith)
- **Primary Language:** TypeScript (ES2020)
- **Architecture:** Domain-driven, Layered
- **Part of:** Ledger Live monorepo

## Quick Reference

| Attribute | Value |
|-----------|-------|
| **Package** | `@ledgerhq/coin-evm` |
| **Version** | 2.37.1 |
| **Tech Stack** | TypeScript, ethers.js, RxJS, Jest |
| **Entry Points** | 11 modules |
| **Source Files** | 139 TypeScript files |
| **Test Files** | 49 test files |

## Generated Documentation

### Core Documents

- [Project Overview](./project-overview.md) - Executive summary and key information
- [Architecture](./architecture.md) - System architecture and design decisions
- [Source Tree Analysis](./source-tree-analysis.md) - Complete directory structure with annotations
- [Development Guide](./development-guide.md) - Setup, scripts, and development workflow

## Existing Documentation

### API Reference

#### Core APIs
- [Bridge](./bridge.md) - Ledger Live bridge integration
- [Synchronization](./synchronization.md) - Account synchronization
- [Transaction](./transaction.md) - Transaction handling
- [Broadcast](./broadcast.md) - Transaction broadcasting
- [Prepare Transaction](./prepareTransaction.md) - Transaction preparation
- [Create Transaction](./createTransaction.md) - Transaction creation
- [Get Transaction Status](./getTransactionStatus.md) - Transaction status
- [Build Optimistic Operation](./buildOptimisticOperation.md) - Optimistic updates
- [Estimate Max Spendable](./estimateMaxSpendable.md) - Max spendable calculation
- [Sign Operation](./signOperation.md) - Operation signing

#### Hardware Wallet
- [HW Get Address](./hw-getAddress.md) - Address derivation
- [HW Sign Message](./hw-signMessage.md) - Message signing

#### Device Configuration
- [Device Transaction Config](./deviceTransactionConfig.md) - Device configuration
- [Speculos Device Actions](./speculos-deviceActions.md) - Speculos testing

#### Supporting Modules
- [Logic](./logic.md) - Core logic functions
- [Types](./types.md) - Type definitions
- [ABIs](./abis.md) - Ethereum ABI definitions
- [Adapters](./adapters.md) - External adapters
- [Preload](./preload.md) - Preload functionality
- [Specs](./specs.md) - Bot test specifications
- [NFT Resolvers](./nftResolvers.md) - NFT resolution

### API Layer Documentation

- [API / NFT](./api/nft.md) - NFT API documentation

#### Explorer APIs
- [API / Explorer](./api/explorer/) - Block explorer integration

#### Gas Tracker APIs
- [API / Gas Tracker](./api/gasTracker/) - Gas price tracking

#### Node APIs
- [API / Node](./api/node/) - Node RPC communication

### Guides

- [Light EVM Integration Guide](./light-evm-integration.md) - **Quick guide for adding EVM L2s/sidechains** (recommended)
- [EVM Family Integration Process](./evm-family-integration-process/README.md) - Full integration guide with optional steps

## Getting Started

### For Library Users

```typescript
import { ... } from "@ledgerhq/coin-evm";
```

The library exposes multiple entry points:
- Main API: `@ledgerhq/coin-evm/api`
- Bridge: `@ledgerhq/coin-evm/bridge`
- Logic: `@ledgerhq/coin-evm/logic`
- Types: `@ledgerhq/coin-evm/types`

### For Contributors

1. Clone the [ledger-live](https://github.com/LedgerHQ/ledger-live) repository
2. Run `pnpm install` from monorepo root
3. Navigate to `libs/coin-modules/coin-evm`
4. Run `pnpm test` to verify setup
5. See [Development Guide](./development-guide.md) for more details

## AI-Assisted Development

When working with AI assistants on this codebase:

1. **Architecture First:** Review [Architecture](./architecture.md) to understand the layered structure
2. **Entry Points:** Use [Source Tree](./source-tree-analysis.md) to find the right module
3. **Existing Patterns:** Check existing docs for API patterns and conventions
4. **Testing:** Follow the testing patterns documented in [Development Guide](./development-guide.md)

### Key Patterns

- **Network calls:** Go through `src/network/` layer
- **Business logic:** Implement in `src/logic/`
- **External integration:** Use adapter pattern in `src/adapters/`
- **Type definitions:** Export from `src/types/`

## Document Generation Info

| Field | Value |
|-------|-------|
| **Generated** | 2026-01-14 |
| **Scan Level** | Quick |
| **Mode** | Initial Scan |
| **State File** | [project-scan-report.json](./project-scan-report.json) |
