# Story 1.5: Block Information & Unsupported Methods

Status: done

## Story

As a **Coin Module Developer**,
I want to retrieve the current block height and receive clear errors for unsupported methods,
So that I understand what capabilities are available.

## Acceptance Criteria

### AC1: lastBlock() Returns Current Block Height
**Given** the MultiversX network is accessible
**When** I call `api.lastBlock()`
**Then** I receive a `BlockInfo` object with the current block height

### AC2: getBlock() Throws Not Supported Error
**Given** any valid parameters
**When** I call `api.getBlock()`
**Then** an error is thrown with message `"getBlock is not supported"`

### AC3: getBlockInfo() Throws Not Supported Error
**Given** any valid parameters
**When** I call `api.getBlockInfo()`
**Then** an error is thrown with message `"getBlockInfo is not supported"`

## Tasks / Subtasks

- [x] Task 1: Implement lastBlock() method (AC: #1)
  - [x] 1.1: Import existing `getBlockchainBlockHeight` from network layer
  - [x] 1.2: Create `lastBlock` method returning `BlockInfo` object
  - [x] 1.3: Map network response to `BlockInfo` interface format
  - [x] 1.4: Add JSDoc documentation (`@param`, `@returns` only)

- [x] Task 2: Implement getBlock() unsupported method (AC: #2)
  - [x] 2.1: Add `getBlock` method to createApi return object
  - [x] 2.2: Throw error with exact message: `"getBlock is not supported"`
  - [x] 2.3: Add JSDoc noting method is unsupported

- [x] Task 3: Implement getBlockInfo() unsupported method (AC: #3)
  - [x] 3.1: Add `getBlockInfo` method to createApi return object
  - [x] 3.2: Throw error with exact message: `"getBlockInfo is not supported"`
  - [x] 3.3: Add JSDoc noting method is unsupported

- [x] Task 4: Unit Tests (AC: #1, #2, #3)
  - [x] 4.1: Add unit test for `lastBlock` returning BlockInfo
  - [x] 4.2: Add unit test for `getBlock` throwing correct error
  - [x] 4.3: Add unit test for `getBlockInfo` throwing correct error

- [x] Task 5: Integration Tests (AC: #1)
  - [x] 5.1: Add integration test for `lastBlock` against mainnet
  - [x] 5.2: Verify returned block height is a positive number
  - [x] 5.3: Add test to `src/api/index.integ.test.ts` in `describe("lastBlock")` block

## Dev Notes

### Critical Implementation Details

**Error Message Format (ADR-003 Compliance):**
```typescript
// ✅ CORRECT - Exact format required
getBlock: () => { throw new Error("getBlock is not supported"); },
getBlockInfo: () => { throw new Error("getBlockInfo is not supported"); },

// ❌ WRONG - Generic or inconsistent messages
getBlock: () => { throw new Error("Not supported"); },
getBlock: () => { throw new Error("Method not available"); },
```

**BlockInfo Interface:**
The `lastBlock()` method must return a `BlockInfo` object from `@ledgerhq/coin-framework/api/types`. Check the interface definition:
```typescript
interface BlockInfo {
  height: number;
  hash?: string;
  timestamp?: number;
}
```

**Network Layer Usage:**
```typescript
// Use existing MultiversXApi class from apiCalls.ts
// The getBlockchainBlockHeight method is in src/api/apiCalls.ts

// In createApi (pattern from coin-filecoin):
lastBlock: async () => {
  const api = new MultiversXApi(config.explorerUrl);
  const height = await api.getBlockchainBlockHeight();
  return { height };
},
```

**Existing Function Location:**
- File: `libs/coin-modules/coin-multiversx/src/api/apiCalls.ts`
- Class: `MultiversXApi`
- Method: `getBlockchainBlockHeight(): Promise<number>`

### Architecture Compliance

| Requirement | Implementation |
|-------------|----------------|
| ADR-003 | Error format: `"{methodName} is not supported"` |
| ADR-005 | Integration tests in single `index.integ.test.ts` file |
| NFR1 | Use MultiversX mainnet explorer endpoints |
| NFR10 | Handle network timeouts gracefully |

### Unsupported Methods Summary

This story completes the "not supported" methods for block queries. After this story, the following methods throw "not supported":
- `getBlock()` - implemented in this story
- `getBlockInfo()` - implemented in this story
- `getRewards()` - Story 3.4
- `craftRawTransaction()` - Story 4.8

### Project Structure Notes

**Files to Modify:**

| File | Change |
|------|--------|
| `src/api/index.ts` | Add `lastBlock`, `getBlock`, `getBlockInfo` methods |
| `src/api/index.test.ts` | Add unit tests for all 3 methods |
| `src/api/index.integ.test.ts` | Add integration test for `lastBlock` |

**Import Pattern (Required):**
```typescript
// External → Internal → Types
import type { BlockInfo } from "@ledgerhq/coin-framework/api/types";

import { getBlockchainBlockHeight } from "../network";
```

### Testing Requirements

**Unit Test Structure:**
```typescript
describe("Block Methods", () => {
  describe("lastBlock", () => {
    it("returns BlockInfo with current height", async () => {
      // Mock network response
      // Verify returns { height: number }
    });
  });

  describe("getBlock", () => {
    it("throws 'getBlock is not supported' error", async () => {
      await expect(api.getBlock()).rejects.toThrow("getBlock is not supported");
    });
  });

  describe("getBlockInfo", () => {
    it("throws 'getBlockInfo is not supported' error", async () => {
      await expect(api.getBlockInfo()).rejects.toThrow("getBlockInfo is not supported");
    });
  });
});
```

**Integration Test Structure:**
```typescript
// In src/api/index.integ.test.ts
describe("MultiversX API Integration", () => {
  describe("lastBlock", () => {
    it("returns current block height from mainnet", async () => {
      const blockInfo = await api.lastBlock();
      expect(blockInfo.height).toBeGreaterThan(0);
      expect(typeof blockInfo.height).toBe("number");
    });
  });
});
```

### Dependencies on Previous Stories

This story depends on:
- **Story 1.1**: `createApi()` factory must exist
- **Story 1.1**: Basic API structure in `src/api/index.ts`

This story is the **final story in Epic 1**. Upon completion, all core API methods for account/balance queries will be functional.

### References

- [Source: PRD - FR20] Block height retrieval via `lastBlock()`
- [Source: PRD - FR21] `getBlock()`/`getBlockInfo()` throw "not supported"
- [Source: Architecture - ADR-003] Error handling pattern for unsupported methods
- [Source: Architecture - ADR-005] Single integration test file requirement
- [Source: Project Context] Error message format: `"{methodName} is not supported"`
- [Source: coin-filecoin Reference] `libs/coin-modules/coin-filecoin/src/api/index.ts`

### Reference Implementation

**coin-filecoin pattern for unsupported methods:**
```typescript
// libs/coin-modules/coin-filecoin/src/api/index.ts
getBlock: () => {
  throw new Error("getBlock is not supported");
},
```

Follow this exact pattern for `getBlock` and `getBlockInfo`.

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

### Completion Notes List

✅ **Task 1: Implement lastBlock() method**
- Implemented `lastBlock()` method using `apiClient.getBlockchainBlockHeight()` from the network layer
- Returns `BlockInfo` object with `{ height: number }` format
- Added JSDoc documentation with `@returns` tag

✅ **Task 2: Implement getBlock() unsupported method**
- Method already existed and throws correct error message: "getBlock is not supported"
- Added JSDoc documentation noting method is unsupported

✅ **Task 3: Implement getBlockInfo() unsupported method**
- Method already existed and throws correct error message: "getBlockInfo is not supported"
- Added JSDoc documentation noting method is unsupported

✅ **Task 4: Unit Tests**
- Added unit test for `lastBlock` returning BlockInfo with mocked network response
- Unit tests for `getBlock` and `getBlockInfo` already existed and verify correct error messages

✅ **Task 5: Integration Tests**
- Added integration test for `lastBlock` against MultiversX mainnet
- Tests verify returned block height is a positive number and has correct structure

### File List

- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Implemented `lastBlock()` method, added JSDoc to `getBlock()` and `getBlockInfo()`
- `libs/coin-modules/coin-multiversx/src/api/index.test.ts` - Added unit tests for `lastBlock()` method
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Added integration tests for `lastBlock()` method
- `libs/coin-modules/coin-multiversx/jest.config.js` - Added `.integ.test.ts` to testPathIgnorePatterns
- `libs/coin-modules/coin-multiversx/jest.integ.config.js` - New integration test configuration file
- `libs/coin-modules/coin-multiversx/package.json` - Added `./api` and `.` exports, added `test-integ` script
- `libs/coin-modules/coin-multiversx/src/__snapshots__/bridge.integration.test.ts.snap` - Deleted (obsolete snapshot)

## Change Log

- 2026-01-30: Implemented `lastBlock()` method, added JSDoc to unsupported methods, added unit and integration tests
- 2026-01-30: [Code Review] Fixed JSDoc to remove `@throws` tags (Project Context compliance), updated File List to include all modified files
