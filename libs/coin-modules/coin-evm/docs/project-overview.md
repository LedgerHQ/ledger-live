# Project Overview

## @ledgerhq/coin-evm

**Version:** 2.37.1  
**License:** Apache-2.0  
**Generated:** 2026-01-14

## Purpose

`@ledgerhq/coin-evm` is the EVM (Ethereum Virtual Machine) coin integration module for Ledger Live. It provides comprehensive support for Ethereum and all EVM-compatible blockchains, enabling:

- Account synchronization and balance tracking
- Transaction creation, signing, and broadcasting
- Gas fee estimation
- NFT support
- Staking operations
- Hardware wallet integration via Ledger devices

## Quick Reference

| Attribute | Value |
|-----------|-------|
| **Type** | TypeScript Library |
| **Architecture** | Domain-driven, Layered |
| **Repository** | `ledger-live` monorepo |
| **Path** | `libs/coin-modules/coin-evm` |
| **Primary Language** | TypeScript (ES2020) |
| **Package Manager** | pnpm (workspace) |
| **Test Framework** | Jest + SWC |

## Tech Stack Summary

- **Blockchain:** ethers.js for EVM interactions
- **HTTP:** Axios for REST API calls
- **Reactive:** RxJS for observable patterns
- **Math:** bignumber.js for precision
- **Testing:** Jest, MSW, fast-check

## Repository Structure

This is a **monolith** library (single cohesive codebase) within the Ledger Live monorepo.

```
coin-evm/
├── src/           # Source code
│   ├── api/       # High-level API
│   ├── bridge/    # Ledger Live bridge
│   ├── logic/     # Business logic
│   ├── network/   # Network layer
│   ├── adapters/  # External adapters
│   ├── staking/   # Staking features
│   └── types/     # Type definitions
├── docs/          # Documentation
├── lib/           # CommonJS build
└── lib-es/        # ESM build
```

## Key Features

### Account Management
- Full account synchronization
- Balance tracking (native + tokens)
- Transaction history retrieval

### Transaction Operations
- Transaction crafting and preparation
- Fee estimation with multiple priority levels
- Transaction broadcasting
- Speed-up and cancel operations

### Network Integration
- Multi-explorer support (Etherscan-like APIs)
- Direct node RPC communication
- Gas price tracking from multiple sources
- NFT metadata resolution

### Hardware Wallet
- Ledger device integration
- Message signing
- Address derivation

## Entry Points

The library exposes 11 main entry points via `index.ts` files:

1. `src/api/` - High-level API
2. `src/bridge/` - Ledger Live bridge
3. `src/logic/` - Core business logic
4. `src/network/explorer/` - Explorer APIs
5. `src/network/gasTracker/` - Gas estimation
6. `src/network/node/` - Node RPC
7. `src/network/nft/` - NFT operations
8. `src/adapters/` - External adapters
9. `src/types/` - Type exports
10. `src/abis/` - ABI definitions
11. `src/staking/` - Staking features

## Statistics

| Metric | Value |
|--------|-------|
| Source Files | 139 TypeScript files |
| Test Files | 49 test files |
| Existing Docs | 22 documentation files |

## Related Resources

- [Architecture](./architecture.md) - Detailed architecture documentation
- [Source Tree](./source-tree-analysis.md) - Complete directory structure
- [Development Guide](./development-guide.md) - Setup and development workflow
- [EVM Integration](./evm-family-integration-process/README.md) - Adding new EVM networks

## Maintainers

This library is maintained by the Ledger Live team as part of the [LedgerHQ/ledger-live](https://github.com/LedgerHQ/ledger-live) repository.
