# Architecture Documentation

## Project: @ledgerhq/coin-evm

**Generated:** 2026-01-14  
**Version:** 2.37.1  
**Type:** TypeScript Library

## Executive Summary

`@ledgerhq/coin-evm` is a TypeScript library that provides EVM (Ethereum Virtual Machine) blockchain integration for Ledger Live applications. It handles all EVM-compatible chain operations including account synchronization, transaction management, staking, and NFT support.

The library follows a domain-driven architecture with clear separation of concerns, featuring a layered design that abstracts network communication, business logic, and external integrations.

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | TypeScript | ES2020 | Primary development language |
| Runtime | Node.js | ≥16 | JavaScript runtime |
| Blockchain | ethers.js | catalog | EVM/Ethereum interactions |
| HTTP | Axios | catalog | REST API communication |
| Reactive | RxJS | catalog | Observable-based async patterns |
| Math | bignumber.js | ^9.1.2 | Precise number handling |
| Testing | Jest + SWC | catalog | Fast unit testing |
| Mocking | MSW | catalog | Network request mocking |
| Package Manager | pnpm | workspace | Monorepo management |

## Architecture Pattern

### Domain-Driven Library Architecture

The library employs a **layered architecture** with clear domain boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│                      External Consumers                      │
│              (Ledger Live Desktop/Mobile/CLI)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
│                    (src/api/index.ts)                        │
│         High-level interface for external consumption        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Bridge Layer                           │
│                   (src/bridge/index.ts)                      │
│        Ledger Live integration and account operations        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic                          │
│                   (src/logic/index.ts)                       │
│    Transaction crafting, fee estimation, balance queries     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Network Layer                            │
│                     (src/network/)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Explorer │ │   Gas    │ │   NFT    │ │   Node   │       │
│  │   API    │ │ Tracker  │ │   API    │ │   RPC    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Adapters Layer                           │
│                   (src/adapters/)                            │
│         External service adapters and integrations           │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Modular Entry Points:** Each functional area has its own `index.ts` export, enabling tree-shaking and selective imports.

2. **Network Abstraction:** The `src/network/` layer abstracts different data sources (explorers, gas trackers, nodes) behind consistent interfaces.

3. **Adapter Pattern:** External integrations use adapters (`src/adapters/`) for loose coupling and testability.

4. **Bridge Pattern:** The `src/bridge/` module provides Ledger Live-specific integration without coupling core logic.

5. **Dual Build Output:** Both CommonJS and ESM builds support various consumption patterns.

## Module Overview

### Core Modules

#### API Layer (`src/api/`)
High-level API for external consumers. Orchestrates lower-level modules to provide complete operations.

#### Bridge (`src/bridge/`)
Ledger Live-specific integration layer. Implements the coin-framework bridge interface for account management.

#### Logic (`src/logic/`)
Core business logic including:
- `broadcast.ts` - Transaction broadcasting
- `craftTransaction.ts` - Transaction construction
- `estimateFees.ts` - Gas/fee estimation
- `getBalance.ts` - Balance queries
- `getSequence.ts` - Nonce management
- `synchronization.ts` - Account sync operations

#### Network (`src/network/`)
Network abstraction layer with specialized sub-modules:
- `explorer/` - Block explorer APIs (Etherscan-like)
- `gasTracker/` - Gas price estimation
- `node/` - Direct node RPC communication
- `nft/` - NFT-related API calls

### Supporting Modules

#### Types (`src/types/`)
TypeScript type definitions for all domain objects.

#### ABIs (`src/abis/`)
Ethereum ABI definitions for smart contract interactions.

#### Adapters (`src/adapters/`)
External service adapters following the adapter pattern.

#### Staking (`src/staking/`)
Staking-specific functionality for supported networks.

#### Edit Transaction (`src/editTransaction/`)
Transaction modification logic (speed-up, cancel operations).

## Data Flow

### Account Synchronization Flow

```
Request → API Layer → Bridge → Logic (sync) → Network (explorer/node)
                                    ↓
                              Parse & Validate
                                    ↓
                              Return Account State
```

### Transaction Flow

```
Create TX Request
       ↓
Logic (craftTransaction)
       ↓
Logic (estimateFees) → Network (gasTracker/node)
       ↓
Logic (broadcast) → Network (node)
       ↓
Return TX Hash
```

## Dependencies

### Internal (Monorepo)

| Package | Purpose |
|---------|---------|
| `@ledgerhq/coin-framework` | Base coin module interfaces |
| `@ledgerhq/cryptoassets` | Cryptocurrency definitions |
| `@ledgerhq/devices` | Ledger device interfaces |
| `@ledgerhq/domain-service` | Domain resolution |
| `@ledgerhq/errors` | Error types |
| `@ledgerhq/evm-tools` | EVM utilities |
| `@ledgerhq/live-env` | Environment configuration |
| `@ledgerhq/live-network` | Network utilities |
| `@ledgerhq/live-promise` | Promise utilities |
| `@ledgerhq/logs` | Logging |

### External

| Package | Purpose |
|---------|---------|
| `ethers` | Ethereum library |
| `axios` | HTTP client |
| `rxjs` | Reactive extensions |
| `bignumber.js` | Arbitrary precision math |

## Testing Architecture

- **Unit Tests:** Jest with SWC for fast TypeScript transpilation
- **Integration Tests:** Separate configuration (`jest.integ.config.js`)
- **Mocking:** MSW for network request interception
- **Property Testing:** fast-check for property-based tests
- **Coverage:** JSON, LCOV, and text reporters

## Extension Points

### Adding New EVM Network

1. Add network configuration to `@ledgerhq/cryptoassets`
2. Implement any custom explorer adapter in `src/network/explorer/`
3. Configure gas tracker for the network
4. Add network-specific tests

### Adding New Features

1. Implement logic in `src/logic/`
2. Expose via `src/api/` for external use
3. Update bridge if Ledger Live integration needed
4. Add comprehensive tests

## Related Documentation

- [Source Tree Analysis](./source-tree-analysis.md)
- [Development Guide](./development-guide.md)
- [EVM Integration Process](./evm-family-integration-process/README.md)
- Individual API documentation in `docs/` (e.g., `broadcast.md`, `synchronization.md`)
