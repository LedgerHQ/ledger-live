---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - docs/index.md
  - docs/project-overview.md
  - docs/source-tree-analysis.md
  - docs/architecture-desktop.md
  - docs/architecture-mobile.md
  - docs/architecture-libraries.md
  - docs/development-guide.md
  - docs/testing-guide.md
  - docs/contribution-guide.md
  - docs/api-contracts.md
  - docs/integration-architecture.md
  - _bmad-output/implementation-artifacts/tech-spec-migrate-coin-filecoin-to-alpaca-model.md
date: 2026-01-29
author: Hedi.edelbloute
---

# Product Brief: Alpaca API for coin-multiversx

## Executive Summary

This product brief outlines the implementation of the **Alpaca API** for the `coin-multiversx` module, enabling standardized blockchain operations through the `Api` interface defined in `@ledgerhq/coin-framework`. The initiative modernizes MultiversX integration by extracting core logic into testable functions, implementing comprehensive API methods for balance queries, operations listing, staking (delegations), and transaction crafting with full ESDT token support.

The work aligns coin-multiversx with the architecture migration happening across all coin modules, enables Alpaca backend service integration, and establishes proper test coverage through integration tests against real networks and unit tests for all logic functions.

---

## Core Vision

### Problem Statement

The `coin-multiversx` module currently uses a **legacy bridge-only architecture** that lacks a standardized API interface. This creates three critical gaps:

1. **No Alpaca Backend Compatibility**: The module cannot integrate with centralized Alpaca services for transaction crafting and broadcasting
2. **Limited Testability**: Testing requires mocking the entire bridge layer; there's no isolated logic module with pure, testable functions
3. **Architecture Inconsistency**: The module diverges from the modernized pattern used by recently migrated coins (Filecoin, Algorand, Tezos, XRP), creating maintenance burden and knowledge fragmentation

### Problem Impact

- **Backend teams** cannot leverage MultiversX through the Alpaca service infrastructure
- **Developers** face harder debugging and testing when maintaining MultiversX features
- **Quality assurance** lacks confidence without proper integration and unit test coverage
- **Architecture debt** accumulates as MultiversX falls further behind the standardized pattern

### Why Existing Solutions Fall Short

The current implementation has rich functionality—EGLD transfers, ESDT token support, six delegation modes, validator discovery—but it's all tightly coupled to the bridge layer:

| Current State | Gap |
|---------------|-----|
| `MultiversXApi` class in `apiCalls.ts` | Not implementing the `Api` interface |
| Transaction building in `buildTransaction.ts` | No `craftTransaction()` with `TransactionIntent` |
| Delegation data via `getAccountDelegations` | Not mapped to standardized `Stake` type |
| Validators via `getProviders` | Not mapped to standardized `Validator` type |
| Tests exist for some functions | No integration tests against real network |

### Proposed Solution

Implement a complete **Alpaca API** for coin-multiversx following the proven migration pattern:

**API Implementation (`createApi()`):**

| Method | Implementation | Notes |
|--------|---------------|-------|
| `getBalance(address)` | EGLD + ESDT tokens | Returns `Balance[]` with native and token assets |
| `listOperations(address, pagination)` | EGLD + ESDT transactions | Merged and sorted by block height |
| `getStakes(address)` | From `getAccountDelegations` | Maps to `Stake[]` with delegation details |
| `getRewards(address)` | Not supported | Historical rewards not available via API |
| `getValidators()` | From `getProviders` | Maps to `Validator[]` with APR, identity |
| `lastBlock()` | From `getBlockchainBlockHeight` | Returns `BlockInfo` |
| `craftTransaction(intent, fees?)` | Adapt `buildTransactionToSign` | Supports EGLD + ESDT via `asset` field |
| `estimateFees(intent)` | Gas calculation | Returns `FeeEstimation` with gas parameters |
| `broadcast(tx)` | Wrap `submit` | Returns transaction hash |
| `combine(tx, signature)` | New implementation | Combines unsigned tx with signature |
| `validateIntent(intent, balances, fees?)` | Adapt `getTransactionStatus` | Returns `TransactionValidation` |
| `getSequence(address)` | From `getAccountNonce` | Returns nonce as `bigint` |
| `craftRawTransaction()` | Not supported | Not needed for MultiversX |
| `getBlock()` / `getBlockInfo()` | Not supported | Block details not available |

**Type Parameters:**
- `MemoType`: `MemoNotSupported` (MultiversX doesn't support memos)
- `TxDataType`: `TxDataNotSupported`

**Testing Strategy:**
- **Integration tests** (`index.integ.test.ts`): Real network calls for all read methods + `combine`
- **Unit tests**: 100% coverage for logic functions
- **Broadcast excluded**: Requires real signatures, tested via coin-tester only

### Key Differentiators

1. **Full Feature Parity**: Every capability in the current bridge is exposed through the API—including ESDT tokens and all 6 delegation modes
2. **Proven Pattern**: Follows the exact architecture from the successful Filecoin migration
3. **Comprehensive Staking**: Unlike simpler chains, implements `getStakes()` and `getValidators()` with rich metadata (APR, identity, commission)
4. **Backward Compatible**: Existing bridge continues working unchanged; API is additive
5. **Test-First Quality**: Integration tests against real MultiversX network ensure API correctness

---

## Target Users

### Primary Users

#### 1. Coin Module Developer

**Profile:** An engineer on the Ledger Live Coin Integration team who maintains multiple coin modules (5-10 different chains). They follow established patterns but don't have deep expertise in every chain's specifics.

**Context & Motivation:**
- Switches between different coin modules frequently
- Relies on reference implementations (like the Filecoin migration) to understand patterns
- May not know MultiversX-specific concepts (ESDT tokens, delegation vs staking terminology)
- Needs clear, consistent code structure to quickly understand and modify

**Current Pain Points:**
- coin-multiversx has logic scattered across bridge files
- No clear separation between network calls, business logic, and API surface
- Testing is harder without isolated logic functions

**Success Vision:** "I can open coin-multiversx, immediately understand the structure because it matches coin-filecoin/coin-algorand, and confidently make changes with good test coverage."

#### 2. Alpaca Service Engineer

**Profile:** A backend engineer who operates the `alpaca-coin-module` service. They deploy coin modules and expose each Alpaca API method as a REST endpoint.

**Context & Motivation:**
- Works with the `Api` interface abstraction—doesn't need to know chain internals
- Deploys and monitors multiple coin modules via alpaca-coin-module service
- Expects consistent behavior across all coins (same interface, predictable errors)

**Current Pain Points:**
- MultiversX isn't available through alpaca-coin-module
- When adding a new coin, they need confidence the API contract is properly implemented

**Success Vision:** "I deploy coin-multiversx to alpaca-coin-module, and it works just like every other coin—same endpoints, same response shapes, no surprises."

### Secondary Users

#### QA/Test Engineer

**Profile:** An engineer responsible for ensuring coin modules work correctly. They write and maintain integration tests.

**Context & Motivation:**
- Needs integration tests that run against real networks (for read operations)
- Follows testing patterns established by other coin modules
- Validates API contract compliance

**Current Pain Points:**
- Limited test coverage on coin-multiversx
- No integration tests against real MultiversX network

**Success Vision:** "I can run `pnpm test-integ` and have confidence that getBalance, listOperations, getStakes, and getValidators all work against real MultiversX mainnet."

### User Journey

**Coin Module Developer Journey:**

| Stage | Experience |
|-------|------------|
| **Discovery** | Assigned to add a feature or fix a bug in coin-multiversx |
| **Onboarding** | Opens the module, sees familiar structure (`api/`, `logic/`, `bridge/`) matching other coins |
| **Core Usage** | Implements changes using pure logic functions, writes unit tests easily |
| **Success Moment** | Runs integration tests, sees green checkmarks, confident the API works |
| **Long-term** | Uses coin-multiversx as a reference when working on similar coins with staking/tokens |

**Alpaca Service Engineer Journey:**

| Stage | Experience |
|-------|------------|
| **Discovery** | Receives request to add MultiversX to alpaca-coin-module service |
| **Onboarding** | Imports `createApi()` from coin-multiversx, same pattern as other coins |
| **Core Usage** | Deploys service, each API method exposed as endpoint automatically |
| **Success Moment** | All endpoints respond correctly, monitoring shows healthy metrics |
| **Long-term** | MultiversX becomes just another coin in the service, no special handling needed |

---

## Success Metrics

### Definition of Done

The Alpaca API implementation for coin-multiversx is considered complete when:

1. **All unit tests pass** with 100% coverage for logic functions
2. **All integration tests pass** against real MultiversX network
3. **Existing bridge functionality** continues working without regressions

---

### Technical Acceptance Criteria

#### API Implementation Completeness

| Method | Required | Acceptance Criteria |
|--------|----------|---------------------|
| `getBalance(address)` | ✅ | Returns `Balance[]` with native EGLD + ESDT tokens; **must return element with `value: 0n` for empty accounts, not empty array** |
| `listOperations(address, pagination)` | ✅ | Returns EGLD + ESDT operations, sorted by block height |
| `getStakes(address)` | ✅ | Maps delegations to `Stake[]` with correct state mapping |
| `getValidators()` | ✅ | Returns all providers mapped to `Validator[]` with APR, identity |
| `getRewards(address)` | ✅ | Throws "not supported" error |
| `lastBlock()` | ✅ | Returns current block height |
| `craftTransaction(intent, fees?)` | ✅ | Works for native EGLD **and** ESDT token transfers |
| `estimateFees(intent)` | ✅ | Returns gas-based fee estimation |
| `broadcast(tx)` | ✅ | Submits signed transaction, returns hash |
| `combine(tx, signature)` | ✅ | Combines unsigned transaction with signature |
| `validateIntent(intent, balances, fees?)` | ✅ | Validates transaction intent, returns errors/warnings |
| `getSequence(address)` | ✅ | Returns account nonce as `bigint` |
| `craftRawTransaction()` | ❌ | Throws "not supported" error |
| `getBlock()` / `getBlockInfo()` | ❌ | Throws "not supported" error |

#### Behavioral Requirements

- **Empty account handling**: `getBalance()` returns `[{ value: 0n, asset: { type: "native" } }]` for accounts with no funds, never an empty array
- **ESDT token support**: `craftTransaction()` must handle `asset.type === "esdt"` with correct token transfer encoding
- **Delegation state mapping**: `getStakes()` correctly maps MultiversX delegation states to `StakeState` enum

---

### Test Coverage Requirements

#### Unit Tests (100% Coverage)

| Logic Function | Test Requirements |
|----------------|-------------------|
| `getBalance` | Empty account, native only, native + tokens |
| `listOperations` | Empty history, EGLD ops, ESDT ops, pagination |
| `getStakes` | No delegations, single delegation, multiple delegations, undelegating state |
| `getValidators` | Empty list, multiple validators with identity |
| `craftTransaction` | Native transfer, ESDT transfer, delegation modes |
| `combine` | Valid signature combination |
| `estimateFees` | Native transfer, ESDT transfer |
| `validateIntent` | Valid intent, insufficient balance, invalid address |

#### Integration Tests (Real Network)

| API Method | Integration Test Coverage |
|------------|--------------------------|
| `getBalance` | At least 1 test with real address |
| `listOperations` | At least 1 test with address that has history |
| `getStakes` | At least 1 test with delegating address |
| `getValidators` | At least 1 test fetching real providers |
| `lastBlock` | At least 1 test confirming block height |
| `craftTransaction` | Native asset test, ESDT token test |
| `combine` | At least 1 test with mock signature |
| `estimateFees` | At least 1 test with real fee estimation |
| `getSequence` | At least 1 test with real address |
| `broadcast` | **Excluded** - requires real signature, tested via coin-tester only |

---

### Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| Unit test coverage | 100% | Jest coverage report for `logic/` |
| Integration test pass rate | 100% | CI pipeline `test-integ` job |
| API methods implemented | 14/14 | Checklist above |
| Bridge regression | 0 failures | Existing bridge tests pass |

---

## MVP Scope

### Core Features

#### 1. API Implementation

Implement `createApi(config)` factory function returning `Api<MemoNotSupported, TxDataNotSupported>`:

| Category | Methods | Status |
|----------|---------|--------|
| **Balance & Operations** | `getBalance`, `listOperations` | Required |
| **Staking** | `getStakes`, `getValidators` | Required |
| **Transaction** | `craftTransaction`, `estimateFees`, `combine`, `broadcast` | Required |
| **Account** | `getSequence`, `lastBlock` | Required |
| **Validation** | `validateIntent` | Required |
| **Not Supported** | `getRewards`, `craftRawTransaction`, `getBlock`, `getBlockInfo` | Throw error |

#### 2. ESDT Token Support

- `getBalance()` returns native EGLD + all ESDT token balances
- `listOperations()` includes ESDT transfer operations
- `craftTransaction()` handles `asset.type === "esdt"` with proper encoding

#### 3. Delegation Support

- `getStakes()` maps `MultiversXDelegation` to `Stake[]` with correct state
- `getValidators()` maps `MultiversXProvider` to `Validator[]` with APR, identity, commission

#### 4. Testing

- **Unit tests**: 100% coverage for all logic functions
- **Integration tests**: Each API method tested against real MultiversX mainnet (except `broadcast`)

#### 5. Documentation

- Inline JSDoc for all public API functions
- README update documenting `createApi()` usage and configuration

---

### Out of Scope for MVP

| Item | Rationale |
|------|-----------|
| **Bridge refactoring** | API is additive; bridge continues working unchanged |
| **Coin-tester implementation** | Can be added in future iteration |
| **Guarded account handling** | Edge case, not required for core functionality |
| **Historical rewards (`getRewards`)** | MultiversX API doesn't expose reward history |
| **Block details (`getBlock`, `getBlockInfo`)** | Not available via current explorer API |
| **Performance optimization** | Focus on correctness first |

---

### MVP Success Criteria

The MVP is successful when:

1. **All unit tests pass** with 100% coverage for logic functions
2. **All integration tests pass** against real MultiversX mainnet
3. **Existing bridge tests pass** (no regressions)
4. **API can be imported** and used by alpaca-coin-module service
5. **Documentation is complete** and reviewed

---

### Future Vision

#### Phase 2: Bridge Integration
- Refactor bridge to consume logic functions from API layer
- Reduce code duplication between bridge and API
- Single source of truth for business logic

#### Phase 3: Coin-Tester
- Implement coin-tester-multiversx module
- Test transaction scenarios end-to-end with local/testnet node
- Validate `broadcast` functionality

#### Phase 4: Extended Features
- Guarded account support
- Additional delegation modes (if new ones added to MultiversX)
- Performance optimization for high-volume operations

#### Long-term Vision
- coin-multiversx becomes a reference implementation for coins with staking + tokens
- Pattern reused for similar chains (Elrond ecosystem, etc.)
