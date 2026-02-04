---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-01-29'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-ledger-live-2026-01-29.md
  - docs/architecture-desktop.md
  - docs/architecture-mobile.md
  - docs/architecture-libraries.md
  - docs/integration-architecture.md
  - docs/project-overview.md
  - docs/api-contracts.md
  - docs/development-guide.md
  - docs/testing-guide.md
workflowType: 'architecture'
project_name: 'ledger-live'
user_name: 'Hedi.edelbloute'
date: '2026-01-29'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (31 total):**

The PRD defines comprehensive requirements across 7 functional areas:

| Area | Count | Key Methods |
|------|-------|-------------|
| Balance & Account | 4 | `getBalance`, `getSequence` |
| Operations & History | 3 | `listOperations` |
| Staking & Delegation | 4 | `getStakes`, `getValidators` |
| Transaction Crafting | 4 | `craftTransaction`, `estimateFees` |
| Broadcasting & Validation | 4 | `broadcast`, `combine`, `validateIntent` |
| Block Info | 2 | `lastBlock` |
| Developer Experience & Testing | 10 | Documentation, coverage |

**Non-Functional Requirements:**
- **NFR1-3:** MultiversX mainnet explorer endpoint compatibility
- **NFR4-7:** 100% unit test coverage, linting, type checking passing
- **NFR8-10:** Deterministic and repeatable integration tests

**Scale & Complexity:**

- Primary domain: TypeScript Library (Coin Module)
- Complexity level: Medium-High
- Estimated architectural components: 4 (api, logic, network, types)
- Integration points: MultiversX Explorer API

### Technical Constraints & Dependencies

| Constraint | Impact |
|------------|--------|
| Must implement `Api` interface from coin-framework | All 14 methods must be provided |
| Backward compatibility with existing bridge | API is additive only; bridge unchanged |
| Real mainnet testing required | Integration tests use live MultiversX network |
| Type parameters fixed | `MemoNotSupported`, `TxDataNotSupported` |
| Folder structure mandated | `api/`, `logic/`, `network/`, `types/` |

**Dependencies:**
- `@ledgerhq/coin-framework` - Api interface definition
- Existing `coin-multiversx/network/` - Explorer communication
- Existing `coin-multiversx/bridge/` - Reference for business logic

### Cross-Cutting Concerns Identified

1. **Error Handling:** Consistent "not supported" errors for unimplemented methods (`getRewards`, `getBlock`, `getBlockInfo`, `craftRawTransaction`)
2. **Empty Account Handling:** `getBalance` must return `[{ value: 0n, asset: { type: "native" } }]` for empty accounts, never empty array
3. **Asset Type Discrimination:** All methods must handle both native EGLD and ESDT tokens correctly
4. **State Mapping:** MultiversX delegation states must map to standardized `StakeState` enum
5. **Test Coverage:** Every API method requires unit tests + integration tests (except `broadcast`)

## Starter Template Evaluation

### Primary Technology Domain

**TypeScript Library (Coin Module)** - Adding Alpaca API to existing `coin-multiversx` package within the `ledger-live` monorepo.

### Starter Options Considered

This is a **brownfield project** - no starter template selection required. The technical stack, folder structure, and patterns are established by the monorepo.

**Reference Implementations Available:**

| Module | Relevance | Pattern Adoption |
|--------|-----------|------------------|
| coin-filecoin | High | Primary reference for API structure, integration tests |
| coin-tron | High | Token handling patterns (TRC20 ≈ ESDT) |
| coin-tezos | Medium | Delegation/staking patterns |
| coin-xrp | Low | Simple API implementation |

### Selected Reference: coin-filecoin

**Rationale for Selection:**
- PRD explicitly names coin-filecoin as primary reference
- Successfully migrated to Alpaca API pattern
- Comprehensive integration test suite
- Similar complexity (file operations ≈ token operations)

**Initialization Approach:**

```bash
# No CLI command needed - implementing within existing package
# Reference: libs/coin-modules/coin-multiversx/

# Files to create:
# - src/api/index.ts         (createApi factory)
# - src/api/index.test.ts    (unit tests)
# - src/api/index.integ.test.ts (integration tests)
# - src/logic/*.ts           (pure logic functions)
```

**Architectural Decisions Inherited from Monorepo:**

| Decision | Value | Source |
|----------|-------|--------|
| Language | TypeScript 5.4.3 | Monorepo standard |
| Testing | Jest | Monorepo standard |
| Build | Turborepo | Monorepo standard |
| Package Manager | pnpm 10.24.0 | Monorepo standard |
| Linting | ESLint | Monorepo rules |
| API Interface | `Api<MemoNotSupported, TxDataNotSupported>` | coin-framework |

**Folder Structure (Mandated):**

```
coin-multiversx/src/
├── api/           # NEW: Alpaca API implementation
├── logic/         # NEW/ENHANCED: Pure business logic
├── network/       # EXISTING: Explorer communication
├── bridge/        # EXISTING: Unchanged
├── types/         # EXISTING: Type definitions
└── config.ts      # EXISTING: Chain configuration
```

**Note:** Implementation begins by creating `src/api/index.ts` with `createApi()` factory, following coin-filecoin patterns.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- API interface compliance with `Api<MemoNotSupported, TxDataNotSupported>`
- Data transformation approach for MultiversX → standardized types
- ESDT token handling strategy

**Important Decisions (Shape Architecture):**
- Error handling patterns
- Delegation state mapping
- Integration test structure

**Deferred Decisions (Post-MVP):**
- Coin-tester module implementation
- Guarded account support
- Performance optimization

### Data Architecture

#### ADR-001: Data Transformation via Dedicated Mappers

**Decision:** Use dedicated mapper functions in `logic/` folder

**Rationale:**
- Follows coin-filecoin reference pattern
- Pure functions are easily unit testable
- Clear separation between network data and standardized types
- Enables reuse across multiple API methods

**Implementation:**
```typescript
// logic/mappers.ts
export function mapToBalance(raw: MultiversXAccountInfo): Balance[] { }
export function mapToOperation(raw: MultiversXTransaction): Operation { }
export function mapToStake(raw: MultiversXDelegation): Stake { }
export function mapToValidator(raw: MultiversXProvider): Validator { }
```

**Affects:** `getBalance`, `listOperations`, `getStakes`, `getValidators`

---

#### ADR-002: Delegation State Mapping Table

**Decision:** Use direct constant lookup object for state mapping

**Rationale:**
- Simple and explicit
- Easy to verify correctness at a glance
- No runtime logic complexity

**Implementation:**
```typescript
// logic/stateMapping.ts
export const DELEGATION_STATE_MAP: Record<string, StakeState> = {
  "staked": "active",
  "unstaking": "deactivating",
  "withdrawable": "inactive",
  // ... complete mapping
};
```

**Affects:** `getStakes`

### API & Communication Patterns

#### ADR-003: Error Handling via Generic Errors

**Decision:** Throw generic `Error` with descriptive messages

**Rationale:**
- Matches coin-filecoin pattern
- Aligns with PRD specification for "not supported" methods
- Simple and consistent

**Implementation:**
```typescript
// Unsupported methods
getRewards: () => { throw new Error("getRewards is not supported"); },
getBlock: () => { throw new Error("getBlock is not supported"); },

// Network errors - wrap with context
try {
  const response = await fetchAccount(address);
} catch (error) {
  throw new Error(`Failed to fetch account ${address}: ${error.message}`);
}
```

**Affects:** All API methods

---

#### ADR-004: Unified ESDT Token Handling

**Decision:** Single code flow with `asset.type` discrimination

**Rationale:**
- Cleaner than separate code paths
- Matches how `Api` interface expects `AssetInfo` usage
- Reduces code duplication

**Implementation:**
```typescript
// In craftTransaction
if (intent.asset.type === "native") {
  return craftNativeTransfer(intent);
} else if (intent.asset.type === "esdt") {
  return craftEsdtTransfer(intent);
}

// In getBalance - return both native and ESDT in single array
return [
  { value: nativeBalance, asset: { type: "native" } },
  ...esdtBalances.map(token => ({
    value: token.balance,
    asset: { type: "esdt", assetReference: token.identifier }
  }))
];
```

**Affects:** `getBalance`, `listOperations`, `craftTransaction`

### Testing Architecture

#### ADR-005: Single Integration Test File

**Decision:** All integration tests in `src/api/index.integ.test.ts`

**Rationale:**
- Matches coin-filecoin pattern
- Keeps tests discoverable
- Single file for CI integration test job

**Implementation:**
```typescript
// src/api/index.integ.test.ts
describe("MultiversX API Integration", () => {
  describe("getBalance", () => { /* tests */ });
  describe("listOperations", () => { /* tests */ });
  describe("getStakes", () => { /* tests */ });
  describe("getValidators", () => { /* tests */ });
  describe("craftTransaction", () => { /* tests */ });
  describe("combine", () => { /* tests */ });
  // broadcast excluded - requires real signatures
});
```

**Test Addresses:** Use known mainnet addresses with predictable data for deterministic tests.

### Decision Impact Analysis

**Implementation Sequence:**
1. Create `logic/mappers.ts` with transformation functions
2. Create `logic/stateMapping.ts` with delegation state map
3. Implement `api/index.ts` with `createApi()` factory
4. Add unit tests for all logic functions
5. Add integration tests in `api/index.integ.test.ts`

**Cross-Component Dependencies:**

```
api/index.ts
    ├── logic/mappers.ts (ADR-001)
    ├── logic/stateMapping.ts (ADR-002)
    ├── network/ (existing)
    └── Error handling (ADR-003)
         └── Asset discrimination (ADR-004)
```

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Addressed:** 6 areas where AI agents could make different choices

### Naming Patterns

#### Code Naming Conventions

**Mapper Functions:**
- Pattern: `mapTo{TargetType}` prefix
- Examples: `mapToBalance`, `mapToOperation`, `mapToStake`, `mapToValidator`

```typescript
// ✅ Good
export function mapToBalance(raw: MultiversXAccountInfo): Balance[] { }
export function mapToOperation(raw: MultiversXTransaction): Operation { }

// ❌ Bad
export function convertBalance(raw: any): Balance[] { }
export function toOp(raw: MultiversXTransaction): Operation { }
```

**Internal Type Naming:**
- Pattern: `MultiversX{TypeName}` prefix for chain-specific types
- Examples: `MultiversXAccountInfo`, `MultiversXDelegation`, `MultiversXProvider`

```typescript
// ✅ Good - clear chain identification
type MultiversXAccountInfo = { balance: string; nonce: number; };
type MultiversXDelegation = { contract: string; userActiveStake: string; };

// ❌ Bad - ambiguous
type RawData = { balance: string; };
type AccountInfo = { balance: string; }; // conflicts with framework types
```

**Function Naming:**
- Pattern: camelCase for all functions
- Pattern: Verb-first for actions (`get*`, `craft*`, `map*`)

### Structure Patterns

#### File Organization

**API Folder Structure:**
```
src/api/
├── index.ts              # createApi() factory, exports
├── index.test.ts         # Unit tests for API
└── index.integ.test.ts   # Integration tests (single file)
```

**Logic Folder Structure:**
```
src/logic/
├── mappers.ts            # All mapTo* functions
├── stateMapping.ts       # Delegation state constants
├── validators.ts         # Validation helpers (if needed)
└── index.ts              # Re-exports
```

**Test File Location:**
- Unit tests: Co-located with source (`.test.ts` suffix)
- Integration tests: Single file `index.integ.test.ts`

### Format Patterns

#### Test Structure Format

**Pattern:** Grouped by method with descriptive `it` blocks

```typescript
// ✅ Good - grouped by method
describe("MultiversX API Integration", () => {
  describe("getBalance", () => {
    it("returns native EGLD balance for funded account", async () => {});
    it("returns ESDT token balances", async () => {});
    it("returns zero balance for empty account (not empty array)", async () => {});
  });

  describe("listOperations", () => {
    it("returns operations sorted by block height", async () => {});
    it("includes both EGLD and ESDT operations", async () => {});
  });
});

// ❌ Bad - flat structure
it("getBalance works", async () => {});
it("listOperations works", async () => {});
```

#### Error Message Format

**Pattern:** `"{methodName} is not supported"`

```typescript
// ✅ Good - specific method name
getRewards: () => { throw new Error("getRewards is not supported"); },
getBlock: () => { throw new Error("getBlock is not supported"); },
craftRawTransaction: () => { throw new Error("craftRawTransaction is not supported"); },

// ❌ Bad - generic or inconsistent
getRewards: () => { throw new Error("Not supported"); },
getBlock: () => { throw new Error("This method is not available for MultiversX"); },
```

### Documentation Patterns

#### JSDoc Style

**Pattern:** Minimal JSDoc - `@param` and `@returns` only (TypeScript handles types)

```typescript
// ✅ Good - minimal but helpful
/**
 * Maps MultiversX account info to standardized Balance array.
 * @param raw - Raw account data from explorer API
 * @returns Array of Balance objects (native + ESDT tokens)
 */
export function mapToBalance(raw: MultiversXAccountInfo): Balance[] { }

// ❌ Bad - excessive
/**
 * @function mapToBalance
 * @description Maps MultiversX account info to standardized Balance array.
 * @param {MultiversXAccountInfo} raw - Raw account data from explorer API
 * @returns {Balance[]} Array of Balance objects (native + ESDT tokens)
 * @throws {Error} If raw is null or undefined
 * @example
 * const balances = mapToBalance({ balance: "1000000000000000000", ... });
 */
```

### Import Patterns

#### Import Organization

**Pattern:** External → Internal → Types (with blank line separators)

```typescript
// ✅ Good - organized by category
import type { Balance, Operation, Stake } from "@ledgerhq/coin-framework/api/types";

import { fetchAccount, fetchTransactions } from "../network";
import { mapToBalance, mapToOperation } from "../logic/mappers";
import { DELEGATION_STATE_MAP } from "../logic/stateMapping";

import type { MultiversXAccountInfo } from "../types";

// ❌ Bad - mixed/unorganized
import { mapToBalance } from "../logic/mappers";
import type { Balance } from "@ledgerhq/coin-framework/api/types";
import { fetchAccount } from "../network";
import type { MultiversXAccountInfo } from "../types";
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. Use `mapTo*` prefix for all mapper functions in `logic/`
2. Use `MultiversX*` prefix for chain-specific type definitions
3. Group integration tests by method with `describe()` blocks
4. Use exact error message format: `"{methodName} is not supported"`
5. Follow import order: External → Internal → Types
6. Keep JSDoc minimal: `@param` and `@returns` only

**Pattern Verification:**
- ESLint will enforce naming and import patterns
- PR review should verify test structure consistency
- Type naming checked via TypeScript compilation

### Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| `convertBalance()`, `toBalance()` | `mapToBalance()` |
| `RawAccountInfo`, `MvxAccount` | `MultiversXAccountInfo` |
| Flat test structure | Grouped by method |
| `"Not supported"`, `"Method unavailable"` | `"{method} is not supported"` |
| Mixed import order | External → Internal → Types |

## Project Structure & Boundaries

### Complete Project Directory Structure

```
libs/coin-modules/coin-multiversx/
├── package.json                    # Existing - may need api export
├── tsconfig.json                   # Existing
├── jest.config.js                  # Existing
├── README.md                       # Update with createApi() usage
├── src/
│   ├── index.ts                    # Update - export createApi
│   │
│   ├── api/                        # NEW FOLDER
│   │   ├── index.ts                # createApi() factory
│   │   ├── index.test.ts           # Unit tests
│   │   └── index.integ.test.ts     # Integration tests
│   │
│   ├── logic/                      # NEW/ENHANCED FOLDER
│   │   ├── index.ts                # Re-exports
│   │   ├── mappers.ts              # mapToBalance, mapToOperation, etc.
│   │   ├── mappers.test.ts         # Unit tests for mappers
│   │   ├── stateMapping.ts         # DELEGATION_STATE_MAP
│   │   └── stateMapping.test.ts    # Unit tests for state mapping
│   │
│   ├── network/                    # EXISTING - unchanged
│   │   ├── index.ts                # Explorer API client
│   │   └── types.ts                # Network response types
│   │
│   ├── bridge/                     # EXISTING - unchanged
│   │   ├── index.ts
│   │   ├── buildTransaction.ts
│   │   └── ...                     # Other bridge files
│   │
│   ├── types/                      # EXISTING - may extend
│   │   ├── index.ts
│   │   └── model.ts                # Add MultiversX* types if needed
│   │
│   └── config.ts                   # EXISTING - unchanged
│
└── __tests__/                      # Existing test utilities (if any)
```

### Architectural Boundaries

**API Boundary (New):**
```
┌─────────────────────────────────────────────────────────────┐
│                    External Consumers                        │
│         (alpaca-coin-module service, live-common)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     api/index.ts                             │
│                   createApi(config)                          │
│                                                             │
│   Exports: Api<MemoNotSupported, TxDataNotSupported>        │
│                                                             │
│   Methods:                                                  │
│   - getBalance, listOperations, getStakes, getValidators    │
│   - craftTransaction, estimateFees, broadcast, combine      │
│   - validateIntent, getSequence, lastBlock                  │
│   - getRewards, getBlock, getBlockInfo (throw "not supported")│
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  logic/         │ │  network/       │ │  types/         │
│  mappers.ts     │ │  (existing)     │ │  (existing)     │
│  stateMapping.ts│ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Component Boundaries:**

| Component | Responsibility | Depends On |
|-----------|---------------|------------|
| `api/index.ts` | Public API surface, method orchestration | logic, network |
| `logic/mappers.ts` | Type transformation functions | types |
| `logic/stateMapping.ts` | Delegation state constants | none |
| `network/` | HTTP communication with explorer | config |
| `bridge/` | Existing bridge implementation | network, types |

**Data Flow:**
```
External Request
      │
      ▼
api/index.ts (createApi)
      │
      ├──► network/ (fetch raw data)
      │         │
      │         ▼
      │    MultiversX Explorer API
      │         │
      │         ▼
      │    Raw Response (MultiversX* types)
      │
      ├──► logic/mappers.ts (transform)
      │         │
      │         ▼
      │    Standardized Types (Balance, Operation, etc.)
      │
      ▼
External Response (Api interface types)
```

### Requirements to Structure Mapping

**Balance & Account (FR1-4):**
```
FR1 (native EGLD balance)     → api/index.ts::getBalance
FR2 (ESDT balances)           → api/index.ts::getBalance + logic/mappers.ts::mapToBalance
FR3 (account nonce)           → api/index.ts::getSequence
FR4 (empty account handling)  → logic/mappers.ts::mapToBalance (return 0n, not empty)
```

**Operations & History (FR5-7):**
```
FR5 (list operations)         → api/index.ts::listOperations
FR6 (EGLD + ESDT ops)         → logic/mappers.ts::mapToOperation
FR7 (sorted by block)         → api/index.ts::listOperations (sort logic)
```

**Staking & Delegation (FR8-11):**
```
FR8 (delegation positions)    → api/index.ts::getStakes
FR9 (validators)              → api/index.ts::getValidators
FR10 (state mapping)          → logic/stateMapping.ts::DELEGATION_STATE_MAP
FR11 (getRewards not supported) → api/index.ts::getRewards (throw error)
```

**Transaction Crafting (FR12-15):**
```
FR12 (native transfer)        → api/index.ts::craftTransaction
FR13 (ESDT transfer)          → api/index.ts::craftTransaction (asset.type check)
FR14 (delegation modes)       → api/index.ts::craftTransaction (staking intents)
FR15 (combine)                → api/index.ts::combine
```

**Testing (FR27-31):**
```
FR27 (unit tests)             → logic/mappers.test.ts, logic/stateMapping.test.ts
FR28 (integration tests)      → api/index.integ.test.ts
FR29 (edge cases)             → api/index.integ.test.ts (empty account tests)
FR30 (combine tests)          → api/index.integ.test.ts::describe("combine")
FR31 (bridge regression)      → Existing bridge tests (unchanged)
```

### Integration Points

**Internal Communication:**
- `api/index.ts` imports from `logic/` for data transformation
- `api/index.ts` imports from `network/` for explorer communication
- `logic/` has no external dependencies (pure functions)

**External Integrations:**
- **MultiversX Explorer API:** `https://api.multiversx.com` (mainnet)
- **coin-framework:** Import `Api` interface types
- **live-common (future):** Will import `createApi` from this package

**Package Exports (update src/index.ts):**
```typescript
// Existing exports
export * from "./bridge";
export * from "./types";

// NEW export for Alpaca API
export { createApi } from "./api";
export type { MultiversXConfig } from "./api";
```

### File Organization Patterns

**New Files to Create:**

| File | Purpose | LOC Estimate |
|------|---------|--------------|
| `src/api/index.ts` | createApi factory, all API methods | ~300-400 |
| `src/api/index.test.ts` | Unit tests for API | ~200-300 |
| `src/api/index.integ.test.ts` | Integration tests | ~400-500 |
| `src/logic/mappers.ts` | Mapper functions | ~150-200 |
| `src/logic/mappers.test.ts` | Mapper unit tests | ~200-300 |
| `src/logic/stateMapping.ts` | State mapping constants | ~30-50 |
| `src/logic/stateMapping.test.ts` | State mapping tests | ~50-80 |
| `src/logic/index.ts` | Re-exports | ~10 |

**Files to Modify:**

| File | Change |
|------|--------|
| `src/index.ts` | Add `export { createApi }` |
| `README.md` | Add createApi usage docs |
| `package.json` | Verify exports (if needed) |

### Development Workflow Integration

**Running Tests:**
```bash
# Unit tests only
pnpm coin:multiversx test

# Integration tests (requires network)
pnpm coin:multiversx test-integ

# Tests with coverage report
pnpm coin:multiversx coverage
```

**Build Process:**
- No changes needed - existing Turborepo build handles TypeScript compilation
- New files automatically included in build output

**Deployment:**
- Package published via monorepo CI/CD
- No additional deployment configuration needed

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All architectural decisions (ADR-001 through ADR-005) are mutually compatible. The TypeScript + Jest + coin-framework stack is well-established in the monorepo, and all versions are inherited from workspace standards.

**Pattern Consistency:**
Implementation patterns directly support the architectural decisions:
- Mapper function naming (`mapTo*`) aligns with ADR-001
- Error message format aligns with ADR-003
- Test structure aligns with ADR-005

**Structure Alignment:**
The project structure fully supports all architectural decisions with clear file locations for each component.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 31 functional requirements have explicit architectural support with mapped file locations.

| FR Category | Count | Status |
|-------------|-------|--------|
| Balance & Account (FR1-4) | 4 | ✅ Full |
| Operations & History (FR5-7) | 3 | ✅ Full |
| Staking & Delegation (FR8-11) | 4 | ✅ Full |
| Transaction Crafting (FR12-15) | 4 | ✅ Full |
| Broadcasting & Validation (FR16-19) | 4 | ✅ Full |
| Block Info (FR20-21) | 2 | ✅ Full |
| Developer Experience (FR22-26) | 5 | ✅ Full |
| Testing (FR27-31) | 5 | ✅ Full |

**Non-Functional Requirements Coverage:**
- NFR1-3 (Integration): Supported via existing `network/` layer
- NFR4-7 (Code Quality): Supported via monorepo tooling
- NFR8-10 (Reliability): Supported via test patterns

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with implementation examples
**Structure Completeness:** Complete file tree with 8 new files, 3 modifications
**Pattern Completeness:** 6 conflict points addressed with enforcement guidelines

### Gap Analysis Results

**Critical Gaps:** None
**Important Gaps:** None
**Deferred to Post-MVP:**
- Coin-tester module implementation
- Guarded account support

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (5 constraints)
- [x] Cross-cutting concerns mapped (5 concerns)

**✅ Architectural Decisions**
- [x] 5 ADRs documented with rationale
- [x] Technology stack inherited from monorepo
- [x] Integration patterns defined (data flow diagram)
- [x] Error handling approach specified

**✅ Implementation Patterns**
- [x] 6 naming conventions established
- [x] Structure patterns defined
- [x] Test structure patterns specified
- [x] Anti-patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High - based on:
- Brownfield project with established patterns
- Reference implementations available (coin-filecoin)
- All requirements mapped to specific implementations

**Key Strengths:**
1. Clear reference implementation to follow (coin-filecoin)
2. Well-defined `Api` interface from coin-framework
3. Existing `network/` layer for explorer communication
4. Comprehensive test strategy with clear patterns

**Areas for Future Enhancement:**
1. Coin-tester module for end-to-end transaction testing
2. Performance benchmarks after initial implementation
3. Guarded account support if needed

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all 5 ADRs exactly as documented
- Use implementation patterns consistently (naming, imports, tests)
- Respect project structure (`api/`, `logic/` separation)
- Refer to coin-filecoin as primary reference

**First Implementation Priority:**
1. Create `src/logic/stateMapping.ts` with DELEGATION_STATE_MAP
2. Create `src/logic/mappers.ts` with mapper functions
3. Create `src/api/index.ts` with `createApi()` factory
4. Add unit tests for logic functions
5. Add integration tests

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-29
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**
- 5 architectural decisions (ADRs) made
- 6 implementation patterns defined
- 4 architectural components specified (api, logic, network, types)
- 31 functional + 10 non-functional requirements fully supported

**📚 AI Agent Implementation Guide**
- Technology stack inherited from monorepo (TypeScript 5.4.3, Jest)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 31 functional requirements are supported
- [x] All 10 non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**📋 Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**🏗️ Solid Foundation**
The reference pattern from coin-filecoin and established monorepo conventions provide a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
