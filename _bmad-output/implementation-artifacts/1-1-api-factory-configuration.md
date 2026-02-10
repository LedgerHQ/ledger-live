# Story 1.1: API Factory & Configuration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to import and configure `createApi()` from `@ledgerhq/coin-multiversx`,
So that I can start using the MultiversX API with my preferred configuration.

## Acceptance Criteria

1. **Given** a developer imports from `@ledgerhq/coin-multiversx`
   **When** they call `createApi(config)`
   **Then** they receive an `Api<MemoNotSupported, TxDataNotSupported>` object
   **And** the API is configured with the provided MultiversX configuration options

2. **Given** a developer provides no configuration
   **When** they call `createApi()` with default/empty config
   **Then** the API uses default MultiversX mainnet explorer endpoints

3. **Given** the `src/api/index.ts` file is created
   **When** a developer checks the package exports
   **Then** `createApi` is exported from `@ledgerhq/coin-multiversx`

## Tasks / Subtasks

- [x] Task 1: Create `src/api/index.ts` with `createApi()` factory (AC: #1, #2)
  - [x] 1.1: Define `MultiversXApiConfig` interface with optional endpoint overrides
  - [x] 1.2: Implement `createApi(config?: MultiversXApiConfig)` factory function
  - [x] 1.3: Return object implementing `Api<MemoNotSupported, TxDataNotSupported>` interface
  - [x] 1.4: Implement all 14 required API methods (stubs for future stories)
  - [x] 1.5: Add "not supported" error stubs for `getRewards`, `getBlock`, `getBlockInfo`, `craftRawTransaction`

- [x] Task 2: Create `src/api/types.ts` for API-specific types (AC: #1)
  - [x] 2.1: Define `MultiversXApiConfig` type with optional API/delegation endpoints
  - [x] 2.2: Define `MultiversXApi` type alias for the returned API object
  - [x] 2.3: Export all types

- [x] Task 3: Create `src/logic/index.ts` re-exports (AC: #1)
  - [x] 3.1: Create empty `src/logic/index.ts` file with placeholder exports
  - [x] 3.2: Prepare for future mapper function exports

- [x] Task 4: Update `src/index.ts` to export `createApi` (AC: #3)
  - [x] 4.1: Add `export { createApi } from "./api"` to main index
  - [x] 4.2: Add `export type { MultiversXApiConfig, MultiversXApi } from "./api/types"`
  - [x] 4.3: Verify existing exports remain unchanged (backward compatibility)

- [x] Task 5: Create unit tests `src/api/index.test.ts` (AC: #1, #2, #3)
  - [x] 5.1: Test `createApi()` returns object with all required methods
  - [x] 5.2: Test `createApi()` works with no config (defaults)
  - [x] 5.3: Test `createApi(config)` accepts custom configuration
  - [x] 5.4: Test "not supported" methods throw correct error messages

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** Not directly applicable to this story - mapper functions will be added in stories 1.2-1.5.

**ADR-002 (State Mapping):** Not applicable to this story.

**ADR-003 (Error Handling):** Implement "not supported" errors with exact format: `"{methodName} is not supported"`

```typescript
// Required error format for unsupported methods
getRewards: () => { throw new Error("getRewards is not supported"); },
getBlock: () => { throw new Error("getBlock is not supported"); },
getBlockInfo: () => { throw new Error("getBlockInfo is not supported"); },
craftRawTransaction: () => { throw new Error("craftRawTransaction is not supported"); },
```

**ADR-004 (Token Handling):** Prepare for unified ESDT handling via `asset.type` discrimination (implementation in story 1.3).

**ADR-005 (Test Structure):** Create `src/api/index.test.ts` for unit tests. Integration tests will be added in Epic 5.

### Technical Requirements

**Api Interface to Implement:**

The `createApi()` function must return an object implementing:

```typescript
type Api<MemoNotSupported, TxDataNotSupported> = AlpacaApi<MemoNotSupported, TxDataNotSupported> & BridgeApi<MemoNotSupported, TxDataNotSupported>;
```

**Required Methods (14 total):**

| Method | Implementation Status | Story |
|--------|----------------------|-------|
| `getBalance` | Stub (throws) | 1.2, 1.3 |
| `getSequence` | Stub (throws) | 1.4 |
| `lastBlock` | Stub (throws) | 1.5 |
| `listOperations` | Stub (throws) | 2.1-2.3 |
| `getStakes` | Stub (throws) | 3.1 |
| `getValidators` | Stub (throws) | 3.3 |
| `craftTransaction` | Stub (throws) | 4.1-4.3 |
| `estimateFees` | Stub (throws) | 4.4 |
| `combine` | Stub (throws) | 4.5 |
| `broadcast` | Stub (throws) | 4.6 |
| `validateIntent` | Stub (throws) | 4.7 |
| `getRewards` | "not supported" error | This story |
| `getBlock` | "not supported" error | This story |
| `getBlockInfo` | "not supported" error | This story |
| `craftRawTransaction` | "not supported" error | This story |

### Library & Framework Requirements

**Type Imports from coin-framework:**

```typescript
import type { 
  Api, 
  MemoNotSupported, 
  TxDataNotSupported,
  Balance,
  BlockInfo,
  Operation,
  Pagination,
  Page,
  Stake,
  Validator,
  Reward,
  TransactionIntent,
  FeeEstimation,
  CraftedTransaction,
  TransactionValidation
} from "@ledgerhq/coin-framework/api/types";
```

**Reference Implementation (coin-filecoin):**

Follow the pattern from `libs/coin-modules/coin-filecoin/src/api/index.ts`:

```typescript
export function createApi(_config?: FilecoinApiConfig): FilecoinApi {
  return {
    broadcast,
    combine,
    craftTransaction: craft,
    craftRawTransaction,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: operations,
    validateIntent: validate,
    getSequence,
    getBlock,
    getBlockInfo,
    getStakes,
    getRewards,
    getValidators,
  };
}
```

### File Structure Requirements

**Files to Create:**

| File | Purpose | LOC Estimate |
|------|---------|--------------|
| `src/api/index.ts` | `createApi()` factory with method stubs | ~80-100 |
| `src/api/types.ts` | `MultiversXApiConfig`, `MultiversXApi` types | ~30-40 |
| `src/api/index.test.ts` | Unit tests for factory | ~80-100 |
| `src/logic/index.ts` | Empty re-exports placeholder | ~5 |

**Files to Modify:**

| File | Change |
|------|--------|
| `src/index.ts` | Add `export { createApi }` and type exports |

### Existing Code to Leverage

**Current API Layer (`src/api/` folder):**
- `apiCalls.ts`: `MultiversXApi` class with existing methods - can be wrapped by `createApi()`
- `sdk.ts`: High-level SDK functions - can be adapted for Alpaca API
- `dtos/multiversx-account.ts`: `MultiversXAccount` DTO

**Configuration Pattern:**
The current implementation uses environment variables:
- `MULTIVERSX_API_ENDPOINT` → Default is defined in `@ledgerhq/live-env`
- `MULTIVERSX_DELEGATION_API_ENDPOINT` → Default is defined in `@ledgerhq/live-env`

**Recommended Config Interface:**

```typescript
export interface MultiversXApiConfig {
  /** MultiversX API endpoint (default: https://api.multiversx.com) */
  apiEndpoint?: string;
  /** Delegation API endpoint (optional, uses main API if not specified) */
  delegationApiEndpoint?: string;
}
```

### Import Pattern

Follow the established import order:

```typescript
// External imports
import type { Api, MemoNotSupported, TxDataNotSupported } from "@ledgerhq/coin-framework/api/types";

// Internal imports
import { MultiversXApi } from "../api/apiCalls";
import { getEnv } from "@ledgerhq/live-env";

// Type imports
import type { MultiversXApiConfig, MultiversXApi as MultiversXApiType } from "./types";
```

### Testing Requirements

**Unit Tests (`src/api/index.test.ts`):**

```typescript
describe("MultiversX API", () => {
  describe("createApi", () => {
    it("returns an object with all required API methods", () => {
      const api = createApi();
      expect(api.getBalance).toBeDefined();
      expect(api.getSequence).toBeDefined();
      expect(api.lastBlock).toBeDefined();
      // ... all 14 methods
    });

    it("accepts custom configuration", () => {
      const config = { apiEndpoint: "https://custom.api.com" };
      const api = createApi(config);
      expect(api).toBeDefined();
    });

    it("throws 'not supported' for getRewards", async () => {
      const api = createApi();
      await expect(api.getRewards("address")).rejects.toThrow("getRewards is not supported");
    });

    // Similar tests for getBlock, getBlockInfo, craftRawTransaction
  });
});
```

### Project Structure Notes

**Alignment with Unified Project Structure:**
- `src/api/` folder follows coin-filecoin reference pattern
- `src/logic/` folder prepared for future mapper functions
- Package exports via `src/index.ts` (standard pattern)

**Package.json Exports:**
The package uses `package.json` exports field. After this story:
- `@ledgerhq/coin-multiversx` → `src/index.ts` (includes `createApi`)
- `@ledgerhq/coin-multiversx/api` → `src/api/index.ts` (direct API access)

### References

- [Source: libs/coin-framework/src/api/types.ts] - Api interface definition
- [Source: libs/coin-modules/coin-filecoin/src/api/index.ts] - Reference `createApi()` implementation
- [Source: libs/coin-modules/coin-filecoin/src/api/types.ts] - Reference API types
- [Source: libs/coin-modules/coin-multiversx/src/api/apiCalls.ts] - Existing MultiversXApi class
- [Source: libs/coin-modules/coin-multiversx/src/api/sdk.ts] - Existing SDK functions
- [Source: _bmad-output/planning-artifacts/architecture.md] - Architecture decisions (ADR-001 to ADR-005)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] - Original story definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (Cursor)

### Debug Log References

None - Implementation completed without issues.

### Completion Notes List

- Implemented `createApi()` factory function following the coin-filecoin reference pattern
- Created `MultiversXApiConfig` interface with optional `apiEndpoint` and `delegationApiEndpoint` fields
- Created `MultiversXApi` type alias extending `Api<MemoNotSupported, TxDataNotSupported>`
- All 14 required API methods implemented as stubs (throwing "not implemented" for future stories)
- Four methods throw "not supported" errors as per ADR-003: `getRewards`, `getBlock`, `getBlockInfo`, `craftRawTransaction`
- Wired `createApi(config)` to resolve endpoints via `@ledgerhq/live-env` defaults, with config overrides
- Updated package `exports` so `@ledgerhq/coin-multiversx` (root) and `@ledgerhq/coin-multiversx/api` imports work
- Preserved backward compatibility by re-exporting existing SDK functions from `src/api/index.ts`
- Created main `src/index.ts` exporting `createApi`, types, and `createBridges` for backward compatibility
- Created `src/logic/index.ts` placeholder for future mapper functions
- Updated unit tests to validate endpoint resolution/configuration wiring
- Full test suite (18 tests) passes with no regressions
- Linting passes with no new errors (only pre-existing warnings in other files)

## Senior Developer Review (AI)

Date: 2026-01-30

### Findings

- **Fixed:** `createApi(config)` previously ignored config and did not resolve defaults; it now instantiates `MultiversXApi` using config/env resolution.
- **Fixed:** `package.json` exports previously lacked `"."` and `"./api"` entries, making root import and `@ledgerhq/coin-multiversx/api` unreliable.
- **Improved:** Unit tests now assert that endpoint configuration is actually applied (constructor called with expected endpoints).
- **Improved:** Removed incorrect `@param` tags from `MultiversXApiConfig` documentation.

### File List

**New Files:**
- `libs/coin-modules/coin-multiversx/src/api/types.ts` - API configuration and type definitions
- `libs/coin-modules/coin-multiversx/src/api/index.test.ts` - Unit tests for createApi factory
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` - Placeholder for future mapper exports
- `libs/coin-modules/coin-multiversx/src/index.ts` - Main package entry point with createApi export

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Added createApi factory and type imports
- `libs/coin-modules/coin-multiversx/src/api/types.ts` - Documentation fixes
- `libs/coin-modules/coin-multiversx/package.json` - Export map updates for root/api entrypoints

## Change Log

| Date | Change |
|------|--------|
| 2026-01-30 | Story 1.1 implementation complete - Added Alpaca API factory pattern with createApi() function |
| 2026-01-30 | Code review fixes - Wire endpoint configuration + fix package exports + strengthen tests |
