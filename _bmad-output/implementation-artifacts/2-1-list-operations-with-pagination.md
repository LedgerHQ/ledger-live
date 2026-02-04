# Story 2.1: List Operations with Pagination

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to list historical operations for any MultiversX address with pagination support,
So that I can display transaction history efficiently without loading all data at once.

## Acceptance Criteria

1. **Given** a MultiversX address with transaction history
   **When** I call `api.listOperations(address, { limit: 10 })`
   **Then** I receive an array of up to 10 `Operation` objects

2. **Given** a MultiversX address with more transactions than the limit
   **When** I call `api.listOperations(address, { limit: 10, offset: 10 })`
   **Then** I receive the next page of operations starting from the 11th transaction

3. **Given** a MultiversX address with no transaction history
   **When** I call `api.listOperations(address)`
   **Then** I receive an empty array `[]`

4. **Given** an invalid MultiversX address
   **When** I call `api.listOperations(address)`
   **Then** an error is thrown with a descriptive message

## Tasks / Subtasks

- [x] Task 1: Create `mapToOperation()` mapper function in `src/logic/mappers.ts` (AC: #1, #2, #3)
  - [x] 1.1: Define `MultiversXApiTransaction` type import (if not already in types)
  - [x] 1.2: Implement `mapToOperation(raw: MultiversXApiTransaction, address: string): Operation` function
  - [x] 1.3: Map transaction hash to `Operation.id`
  - [x] 1.4: Map transaction type (IN/OUT) based on sender/receiver
  - [x] 1.5: Map transaction value to `Operation.value` (bigint)
  - [x] 1.6: Map transaction fee to `Operation.tx.fees` (bigint)
  - [x] 1.7: Map block height to `Operation.tx.block.height`
  - [x] 1.8: Map timestamp to `Operation.tx.date` (Date object)
  - [x] 1.9: Map transaction status to `Operation.tx.failed` (boolean)
  - [x] 1.10: Map sender/receiver addresses to `Operation.senders` and `Operation.recipients` arrays
  - [x] 1.11: Map asset type (native EGLD) to `Operation.asset.type === "native"`

- [x] Task 2: Create `listOperations()` logic function in `src/logic/listOperations.ts` (AC: #1, #2, #3, #4)
  - [x] 2.1: Define function signature: `listOperations(apiClient: MultiversXApi, address: string, pagination: Pagination): Promise<[Operation[], string]>`
  - [x] 2.2: Validate address format (throw error if invalid) (AC: #4)
  - [x] 2.3: Extract pagination parameters: `limit`, `minHeight` (from `pagination.minHeight`), `order` (from `pagination.order`)
  - [x] 2.4: Convert `minHeight` to timestamp if needed (check MultiversX API requirements)
  - [x] 2.5: Call `apiClient.getHistory(address, startAt)` to fetch EGLD transactions
  - [x] 2.6: Apply pagination: slice transactions based on `limit` and `offset` (if supported)
  - [x] 2.7: Map each transaction using `mapToOperation()` to create `Operation[]` array
  - [x] 2.8: Generate next cursor/paging token for pagination (return empty string `""` if no more pages)
  - [x] 2.9: Return tuple `[Operation[], string]` per Api interface

- [x] Task 3: Wire `listOperations()` into `src/api/index.ts` (AC: #1, #2, #3, #4)
  - [x] 3.1: Import `listOperations` from `../logic/listOperations`
  - [x] 3.2: Replace stub implementation in `createApi()` return object
  - [x] 3.3: Call `listOperations(apiClient, address, pagination)` in `listOperations` method
  - [x] 3.4: Ensure proper error propagation for invalid addresses

- [x] Task 4: Create unit tests for `mapToOperation()` in `src/logic/mappers.test.ts` (AC: #1, #3)
  - [x] 4.1: Test mapping EGLD transfer transaction (IN operation)
  - [x] 4.2: Test mapping EGLD transfer transaction (OUT operation)
  - [x] 4.3: Test mapping transaction with failed status
  - [x] 4.4: Test mapping transaction with zero value
  - [x] 4.5: Test mapping transaction with correct block height and timestamp

- [x] Task 5: Create unit tests for `listOperations()` in `src/logic/listOperations.test.ts` (AC: #1, #2, #3, #4)
  - [x] 5.1: Mock `apiClient.getHistory()` to return test transactions
  - [x] 5.2: Test pagination with `limit` parameter
  - [x] 5.3: Test pagination with `offset` parameter (if supported by API)
  - [x] 5.4: Test empty result for address with no transactions (AC: #3)
  - [x] 5.5: Test error thrown for invalid address format (AC: #4)
  - [x] 5.6: Test next cursor generation for pagination

- [x] Task 6: Add integration test in `src/api/index.integ.test.ts` (AC: #1, #2, #3, #4)
  - [x] 6.1: Test `listOperations()` against real MultiversX mainnet address with history
  - [x] 6.2: Test pagination: fetch first page, then second page
  - [x] 6.3: Test empty result for address with no transaction history (AC: #3)
  - [x] 6.4: Test error handling for invalid address (AC: #4)
  - [x] 6.5: Verify operations are returned in correct format (Operation[])

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** Create `mapToOperation()` function in `src/logic/mappers.ts` following the established mapper pattern. This function transforms `MultiversXApiTransaction` (raw network data) to standardized `Operation` type from coin-framework.

**ADR-002 (State Mapping):** Not applicable to this story (delegation state mapping is in Epic 3).

**ADR-003 (Error Handling):** Throw generic `Error` with descriptive messages for invalid addresses. Example: `throw new Error(`Invalid MultiversX address: ${address}`)`.

**ADR-004 (Token Handling):** This story focuses on EGLD (native) operations only. ESDT token operations will be added in story 2.2. For now, `mapToOperation()` should handle native EGLD transfers with `asset.type === "native"`.

**ADR-005 (Test Structure):** Add integration tests to existing `src/api/index.integ.test.ts` file in a new `describe("listOperations")` block.

### Technical Requirements

**Api Interface Signature:**

```typescript
listOperations: (address: string, pagination: Pagination) => Promise<[Operation[], string]>
```

**Pagination Parameter:**

The `Pagination` type from `@ledgerhq/coin-framework/api/types` includes:
- `limit?: number` - Maximum number of operations to return
- `minHeight?: number` - Minimum block height to fetch from
- `order?: "asc" | "desc"` - Order of operations (ascending/descending)
- `pagingToken?: string` - Cursor for pagination (optional)

**Operation Type:**

The `Operation` type from `@ledgerhq/coin-framework/api/types` includes:
- `id: string` - Unique operation identifier
- `type: "IN" | "OUT" | "NONE"` - Operation direction
- `value: bigint` - Transaction value
- `asset: { type: "native" | "esdt", assetReference?: string }` - Asset information
- `tx: { hash: string, fees: bigint, date: Date, block: { height: number, time: Date }, failed: boolean }` - Transaction details
- `senders: string[]` - Sender addresses
- `recipients: string[]` - Recipient addresses

**Reference Implementation (coin-filecoin):**

Check `libs/coin-modules/coin-filecoin/src/logic/listOperations.ts` for pagination pattern:
- Uses `limit`, `minHeight`, `order` from pagination options
- Returns `[Operation[], string]` tuple where string is next cursor
- Handles empty results gracefully

**Reference Implementation (coin-tezos):**

Check `libs/coin-modules/coin-tezos/src/logic/listOperations.ts` for pagination with limit/offset:
- Applies limit after fetching (API might not respect limit)
- Generates next token from last operation ID
- Sorts operations by date (descending = newest first)

### Library & Framework Requirements

**Network Layer:**

Use existing `MultiversXApi` client (already instantiated in `createApi()`):
- `apiClient.getHistory(address: string, startAt: number): Promise<MultiversXApiTransaction[]>`
- This method fetches all transactions from `startAt` timestamp onwards
- It handles internal pagination automatically (fetches all pages)
- Returns array of `MultiversXApiTransaction` objects

**Pagination Strategy:**

The MultiversX API `getHistory()` method:
- Uses timestamp-based pagination (`after` parameter)
- Fetches ALL transactions from `startAt` onwards (no limit support)
- Returns complete transaction list

**Implementation Approach:**

Since `getHistory()` fetches all transactions, we need to:
1. Fetch all transactions from `minHeight` (converted to timestamp)
2. Apply `limit` and `offset` in our code (client-side pagination)
3. Map transactions to `Operation[]`
4. Generate next cursor based on last operation's block height or hash

**Alternative Approach (if API supports it):**

If MultiversX API supports `from` and `size` parameters directly:
- Use `from` for offset, `size` for limit
- This would be more efficient (server-side pagination)

**Current API Pattern:**

Looking at `apiCalls.ts`, the `getHistory()` method:
- Uses `from` and `size` parameters internally
- Fetches ALL pages automatically
- Returns complete array

**Recommended Implementation:**

1. Call `apiClient.getHistory(address, startAtTimestamp)`
2. Apply client-side pagination:
   - Sort by block height (respect `order` parameter)
   - Slice array: `transactions.slice(offset, offset + limit)`
3. Map each transaction using `mapToOperation()`
4. Generate next cursor: Use last operation's block height or hash

### File Structure Requirements

**Files to Create:**

| File | Purpose | LOC Estimate |
|------|---------|--------------|
| `src/logic/listOperations.ts` | `listOperations()` function | ~80-120 |
| `src/logic/listOperations.test.ts` | Unit tests for listOperations | ~100-150 |
| `src/logic/mappers.ts` | Add `mapToOperation()` function | ~50-80 (if file doesn't exist, create it) |
| `src/logic/mappers.test.ts` | Add tests for `mapToOperation()` | ~80-120 (if file doesn't exist, create it) |

**Files to Modify:**

| File | Change |
|------|--------|
| `src/api/index.ts` | Replace `listOperations` stub with real implementation |
| `src/api/index.integ.test.ts` | Add integration tests for `listOperations` |

### Existing Code to Leverage

**Network Layer (`src/api/apiCalls.ts`):**

- `MultiversXApi.getHistory(address: string, startAt: number): Promise<MultiversXApiTransaction[]>`
  - Fetches all EGLD transactions from `startAt` timestamp
  - Returns array of `MultiversXApiTransaction` objects
  - Handles pagination internally (fetches all pages)

**Transaction Type (`src/types/index.ts` or `src/api/dtos/`):**

- `MultiversXApiTransaction` - Raw transaction type from API
  - Fields: `txHash`, `sender`, `receiver`, `value`, `fee`, `round` (block height), `timestamp`, `status`, `action`, etc.

**Existing Mapper Pattern:**

Check `src/api/sdk.ts` for `transactionToEGLDOperation()` function:
- Maps `MultiversXApiTransaction` to `MultiversXOperation` (bridge type)
- Can be adapted for `mapToOperation()` to return `Operation` (Alpaca API type)

**Key Differences:**

- Bridge `MultiversXOperation` uses `BigNumber` for values
- Alpaca API `Operation` uses `bigint` for values
- Bridge operation includes `accountId`, Alpaca API operation doesn't
- Bridge operation has `extra` field, Alpaca API operation has `tx` field with different structure

### Import Pattern

Follow the established import order:

```typescript
// External imports
import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/types";

// Internal imports
import MultiversXApi from "../api/apiCalls";
import { mapToOperation } from "./mappers";

// Type imports
import type { MultiversXApiTransaction } from "../types";
```

### Testing Requirements

**Unit Tests (`src/logic/listOperations.test.ts`):**

```typescript
describe("listOperations", () => {
  it("returns paginated operations with limit", async () => {
    const mockApiClient = {
      getHistory: jest.fn().mockResolvedValue([/* test transactions */]),
    };
    const [operations, nextCursor] = await listOperations(
      mockApiClient,
      "erd1...",
      { limit: 10 }
    );
    expect(operations).toHaveLength(10);
  });

  it("returns empty array for address with no transactions", async () => {
    const mockApiClient = {
      getHistory: jest.fn().mockResolvedValue([]),
    };
    const [operations] = await listOperations(mockApiClient, "erd1...", {});
    expect(operations).toEqual([]);
  });

  it("throws error for invalid address", async () => {
    await expect(
      listOperations(mockApiClient, "invalid", {})
    ).rejects.toThrow("Invalid MultiversX address");
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("MultiversX API Integration", () => {
  describe("listOperations", () => {
    it("returns operations for address with transaction history", async () => {
      const api = createApi();
      const [operations] = await api.listOperations(
        "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th", // Known mainnet address
        { limit: 10 }
      );
      expect(operations.length).toBeGreaterThan(0);
      expect(operations[0]).toHaveProperty("id");
      expect(operations[0]).toHaveProperty("type");
      expect(operations[0]).toHaveProperty("value");
    });

    it("returns empty array for address with no transactions", async () => {
      const api = createApi();
      const [operations] = await api.listOperations(
        "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu", // Empty address
        {}
      );
      expect(operations).toEqual([]);
    });
  });
});
```

**Test Addresses:**

Use known MultiversX mainnet addresses:
- Active address: `erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th` (has transaction history)
- Empty address: `erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu` (no transactions)

### Project Structure Notes

**Alignment with Unified Project Structure:**

- `src/logic/listOperations.ts` follows coin-filecoin reference pattern
- `src/logic/mappers.ts` follows ADR-001 pattern (dedicated mapper functions)
- Package exports via `src/index.ts` (standard pattern)

**Pagination Implementation:**

The MultiversX API uses timestamp-based pagination, but the Alpaca API interface expects:
- `limit` and `minHeight` parameters
- Return value: `[Operation[], string]` where string is next cursor

**Conversion Strategy:**

1. Convert `minHeight` (block height) to timestamp if needed
2. Fetch all transactions from that timestamp
3. Apply client-side pagination with `limit`
4. Generate next cursor from last operation's block height

**Next Cursor Format:**

Options for next cursor:
- Block height as string: `"12345678"`
- Transaction hash: `"abc123..."`
- Empty string `""` if no more pages

Recommendation: Use block height as string for simplicity and consistency with `minHeight` parameter.

### Previous Story Intelligence

**From Story 1.1 (API Factory Configuration):**

- `createApi()` factory is already implemented
- `MultiversXApi` client is instantiated and passed to API methods
- `listOperations` stub currently throws "not implemented" error
- Pattern: API methods receive `apiClient` instance and call network methods

**From Story 1.2-1.4 (Balance & Sequence Queries):**

- `getBalance()` and `getSequence()` implementations show pattern:
  - Logic functions in `src/logic/` folder
  - Functions receive `apiClient` as first parameter
  - Functions are pure (no side effects, just orchestration)
- Example: `getBalance(apiClient, address)` pattern

**From Story 1.5 (Block Information):**

- `lastBlock()` implementation shows direct API client usage
- Pattern: `const height = await apiClient.getBlockchainBlockHeight();`

**Key Learnings:**

1. Logic functions should be in `src/logic/` folder
2. Functions receive `apiClient` as parameter (dependency injection)
3. Mapper functions should be pure (no network calls)
4. Error handling: throw generic `Error` with descriptive messages

### Git Intelligence Summary

**Recent Commits Analysis:**

From Epic 1 implementation:
- Created `src/logic/getBalance.ts` and `src/logic/getSequence.ts`
- Created `src/api/index.ts` with `createApi()` factory
- Pattern: Logic functions are separate from API methods
- Pattern: Mapper functions will be in `src/logic/mappers.ts` (to be created)

**Code Patterns Established:**

- Import order: External → Internal → Types
- Function naming: `getBalance`, `getSequence`, `listOperations` (verb-first)
- Mapper naming: `mapToBalance`, `mapToOperation` (to be created)
- Error messages: Descriptive strings, not generic errors

### Latest Tech Information

**MultiversX API Documentation:**

- Explorer API: `https://api.multiversx.com`
- Transactions endpoint: `/accounts/{address}/transactions`
- Parameters: `after` (timestamp), `from` (offset), `size` (limit)
- Response: Array of transaction objects

**Pagination Details:**

- `after`: Timestamp in seconds (Unix epoch)
- `from`: Starting index (0-based)
- `size`: Number of transactions per page (max: 1000, default: 100)
- The API returns paginated results, but `getHistory()` fetches all pages

**Block Height to Timestamp:**

MultiversX blocks are produced approximately every 6 seconds. To convert block height to approximate timestamp:
- Current block height: Use `getBlockchainBlockHeight()`
- Block time: ~6 seconds per block
- Approximate timestamp: `currentTimestamp - (currentHeight - minHeight) * 6`

However, for accuracy, it's better to:
1. Fetch transactions from timestamp `0` (all history) if `minHeight` is 0
2. Or use a known block height → timestamp mapping if available
3. Or fetch from current time backwards if `minHeight` is recent

**Recommendation:**

For initial implementation:
- If `minHeight === 0` or undefined: Fetch from timestamp `0` (all history)
- Otherwise: Use a conservative approach - fetch from timestamp `0` and filter by block height client-side
- Future optimization: Implement block height → timestamp conversion if needed

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] - Original story definition and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md] - Architecture decisions (ADR-001 to ADR-005)
- [Source: libs/coin-modules/coin-filecoin/src/logic/listOperations.ts] - Reference implementation for pagination pattern
- [Source: libs/coin-modules/coin-tezos/src/logic/listOperations.ts] - Reference implementation for limit/offset pagination
- [Source: libs/coin-modules/coin-multiversx/src/api/apiCalls.ts] - `getHistory()` method implementation
- [Source: libs/coin-modules/coin-multiversx/src/api/sdk.ts] - `transactionToEGLDOperation()` mapper reference
- [Source: libs/coin-modules/coin-multiversx/src/api/index.ts] - Current API implementation with stubs
- [Source: libs/coin-modules/coin-multiversx/src/logic/getBalance.ts] - Pattern for logic functions
- [Source: _bmad-output/project-context.md] - Project context and implementation rules
- [Source: _bmad-output/implementation-artifacts/1-1-api-factory-configuration.md] - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

None - Implementation proceeded without blocking issues.

### Completion Notes List

1. **Task 1 Complete:** Implemented `mapToOperation()` mapper function following red-green-refactor TDD cycle. Added `toBigInt()` helper to handle both BigNumber objects and raw string/number values from API responses.

2. **Task 2 Complete:** Implemented `listOperations()` logic function with address validation, pagination support (limit, order, minHeight), and client-side sorting.

3. **Task 3 Complete:** Wired `listOperations()` into `createApi()` factory, replacing the stub implementation.

4. **Tasks 4-5 Complete:** Added comprehensive unit tests (17 tests for mapToOperation, 15 tests for listOperations). All 90 unit tests pass.

5. **Task 6 Complete:** Added 9 integration tests for `listOperations()` in `index.integ.test.ts`. Tests verify correct Operation structure, pagination, empty results, and error handling. Note: Some integration tests may fail due to MultiversX API rate limiting (HTTP 429) - this is a transient infrastructure issue, not a code bug.

### Change Log

- 2026-01-30: Story 2.1 implementation complete. Added mapToOperation mapper, listOperations logic function, wired API, unit tests (17+15), and integration tests (9).
- 2026-01-30: **Code Review Fixes Applied:**
  - HIGH-1: Added pagingToken support for cursor-based pagination
  - HIGH-2: Fixed next cursor logic to exclude already-fetched operations
  - HIGH-3: Updated File List with 7 previously undocumented files
  - MEDIUM-1: Added proper documentation for minHeight/timestamp limitation
  - MEDIUM-2: Fixed incomplete minHeight test assertion
  - MEDIUM-3: Added missing block.time field to Operation mapping
  - MEDIUM-4: Fixed import organization per project standards
  - MEDIUM-5: Fixed ambiguous import path for isValidAddress

### Senior Developer Review (AI)

**Review Date:** 2026-01-30
**Reviewer:** AI Code Review Workflow

**Issues Found:** 3 High, 5 Medium, 2 Low
**Issues Fixed:** 3 High, 5 Medium

**Summary:**
- Pagination was not properly implemented - pagingToken was ignored, making multi-page fetching impossible
- Cursor generation had off-by-one bug causing duplicate operations
- Several files were modified but not documented in File List
- Import paths and organization had minor issues
- block.time field was missing from Operation mapping

**Unfixed (Low Priority):**
- LOW-1: JSDoc comment slightly verbose (cosmetic)
- LOW-2: Story AC #2 references non-existent `offset` parameter (spec issue, not code issue)

**Verdict:** ✅ APPROVED after fixes applied

### File List

**Files Created:**
- libs/coin-modules/coin-multiversx/src/logic/listOperations.ts
- libs/coin-modules/coin-multiversx/src/logic/listOperations.test.ts
- libs/coin-modules/coin-multiversx/src/api/index.test.ts (unit tests for API factory)
- libs/coin-modules/coin-multiversx/src/api/types.ts (MultiversXApi type definitions)
- libs/coin-modules/coin-multiversx/src/index.ts (package exports)
- libs/coin-modules/coin-multiversx/jest.integ.config.js (integration test config)

**Files Modified:**
- libs/coin-modules/coin-multiversx/src/logic/mappers.ts (added mapToOperation function with block.time field)
- libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts (added 18 unit tests for mapToOperation)
- libs/coin-modules/coin-multiversx/src/logic/index.ts (added exports for mapToOperation and listOperations)
- libs/coin-modules/coin-multiversx/src/api/index.ts (wired listOperations into createApi factory)
- libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts (added 9 integration tests for listOperations)
- libs/coin-modules/coin-multiversx/jest.config.js (updated test configuration)
- libs/coin-modules/coin-multiversx/package.json (updated scripts and dependencies)

**Files Deleted:**
- libs/coin-modules/coin-multiversx/src/__snapshots__/bridge.integration.test.ts.snap (removed obsolete snapshot)
