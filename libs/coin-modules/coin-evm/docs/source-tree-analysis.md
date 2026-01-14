# Source Tree Analysis

## Project: @ledgerhq/coin-evm

**Generated:** 2026-01-14  
**Scan Level:** Quick  
**Project Type:** TypeScript Library

## Directory Structure

```
coin-evm/
├── docs/                           # Documentation (existing + generated)
│   ├── api/                        # API layer documentation
│   │   ├── explorer/               # Block explorer API docs
│   │   ├── gasTracker/             # Gas estimation API docs
│   │   └── node/                   # Node RPC API docs
│   └── evm-family-integration-process/  # EVM integration guide
│
├── src/                            # Source code root
│   ├── __fixtures__/               # Test fixtures and mock data
│   ├── __tests__/                  # Test suites
│   │   ├── fixtures/               # Test-specific fixtures
│   │   │   └── explorer/           # Explorer test fixtures
│   │   └── unit/                   # Unit tests
│   │       ├── adapters/           # Adapter unit tests
│   │       ├── api/                # API layer unit tests
│   │       │   ├── explorer/       # Explorer API tests
│   │       │   ├── gasTracker/     # Gas tracker tests
│   │       │   └── node/           # Node RPC tests
│   │       ├── editTransaction/    # Transaction editing tests
│   │       │   └── __snapshots__/  # Jest snapshots
│   │       └── staking/            # Staking unit tests
│   │
│   ├── abis/                       # [ENTRY POINT] Ethereum ABI definitions
│   │   └── index.ts                # ABI exports
│   │
│   ├── adapters/                   # [ENTRY POINT] External service adapters
│   │   └── index.ts                # Adapter pattern implementations
│   │
│   ├── api/                        # [ENTRY POINT] High-level API layer
│   │   └── index.ts                # API exports
│   │
│   ├── bridge/                     # [ENTRY POINT] Ledger Live bridge integration
│   │   └── index.ts                # Bridge implementation
│   │
│   ├── datasets/                   # Test datasets and sample data
│   │
│   ├── editTransaction/            # [ENTRY POINT] Transaction modification logic
│   │   └── index.ts                # Edit transaction exports
│   │
│   ├── logic/                      # [ENTRY POINT] Core business logic
│   │   ├── index.ts                # Logic exports
│   │   ├── broadcast.ts            # Transaction broadcasting
│   │   ├── combine.ts              # Transaction combining
│   │   ├── computeIntentType.ts    # Intent type computation
│   │   ├── craftTransaction.ts     # Transaction crafting
│   │   ├── estimateFees.ts         # Fee estimation
│   │   ├── getBalance.ts           # Balance retrieval
│   │   ├── getBlock.ts             # Block data
│   │   ├── getBlockInfo.ts         # Block information
│   │   ├── getSequence.ts          # Nonce/sequence handling
│   │   └── getStakes.ts            # Staking data retrieval
│   │
│   ├── network/                    # Network abstraction layer
│   │   ├── explorer/               # [ENTRY POINT] Block explorer integration
│   │   │   └── index.ts            # Explorer API exports
│   │   ├── gasTracker/             # [ENTRY POINT] Gas price tracking
│   │   │   └── index.ts            # Gas tracker exports
│   │   ├── nft/                    # [ENTRY POINT] NFT operations
│   │   │   └── index.ts            # NFT API exports
│   │   └── node/                   # [ENTRY POINT] Node RPC layer
│   │       └── index.ts            # Node RPC exports
│   │
│   ├── staking/                    # [ENTRY POINT] Staking functionality
│   │   └── index.ts                # Staking exports
│   │
│   ├── test/                       # Test utilities
│   │
│   └── types/                      # [ENTRY POINT] TypeScript type definitions
│       └── index.ts                # Type exports
│
├── lib/                            # CommonJS build output (generated)
├── lib-es/                         # ESM build output (generated)
│
├── package.json                    # Package manifest
├── tsconfig.json                   # TypeScript configuration
├── jest.config.js                  # Jest test configuration
├── jest.integ.config.js            # Integration test configuration
├── .eslintrc.js                    # ESLint configuration
├── .unimportedrc.json              # Unimported dependencies config
└── CHANGELOG.md                    # Version changelog
```

## Critical Folders

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `src/logic/` | Core business logic for EVM operations | Transaction crafting, fee estimation, balance queries |
| `src/network/` | Network abstraction layer | Explorer, gas tracker, NFT, node RPC integrations |
| `src/bridge/` | Ledger Live integration | Bridge implementation for Ledger Live apps |
| `src/adapters/` | External service adapters | Adapter pattern for third-party integrations |
| `src/types/` | Type definitions | TypeScript interfaces and types |
| `src/abis/` | Ethereum ABIs | Smart contract ABI definitions |

## Entry Points

The library exposes multiple entry points via `index.ts` files:

1. **Main Entry Points:**
   - `src/api/index.ts` - High-level API for EVM operations
   - `src/logic/index.ts` - Core business logic
   - `src/bridge/index.ts` - Ledger Live bridge

2. **Network Layer:**
   - `src/network/explorer/index.ts` - Block explorer integration
   - `src/network/gasTracker/index.ts` - Gas price tracking
   - `src/network/node/index.ts` - Node RPC communication
   - `src/network/nft/index.ts` - NFT operations

3. **Supporting Modules:**
   - `src/adapters/index.ts` - External adapters
   - `src/types/index.ts` - Type definitions
   - `src/abis/index.ts` - ABI definitions
   - `src/staking/index.ts` - Staking functionality
   - `src/editTransaction/index.ts` - Transaction editing

## File Statistics

| Metric | Count |
|--------|-------|
| Total TypeScript Files | 139 |
| Test Files | 49 |
| Entry Point Modules | 11 |
| Documentation Files | 22 |

## Build Outputs

The library produces dual build outputs:
- **`lib/`** - CommonJS format (for Node.js `require()`)
- **`lib-es/`** - ESM format (for modern `import` syntax)

## Testing Structure

Tests are organized in two locations:
1. **`src/__tests__/`** - Centralized test directory
   - `unit/` - Unit tests organized by module
   - `fixtures/` - Test fixtures and mock data
2. **Co-located tests** - Some tests live alongside source files (e.g., `src/logic/*.test.ts`)
