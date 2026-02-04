# Story 2.3: Operations Sorting

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want operations returned sorted by block height,
So that I can display transactions in chronological order.

## Acceptance Criteria

1. **Given** a MultiversX address with multiple transactions across different blocks
   **When** I call `api.listOperations(address)`
   **Then** operations are sorted by block height (most recent first for `order: "desc"`, oldest first for `order: "asc"`)

2. **Given** multiple transactions in the same block
   **When** I call `api.listOperations(address)`
   **Then** transactions within the same block maintain a consistent, deterministic order (sorted by secondary key)

3. **Given** operations fetched with pagination
   **When** I fetch page 1 and page 2 using the returned cursor
   **Then** the combined results maintain proper block height ordering with no gaps or duplicates

## Tasks / Subtasks

- [x] Task 1: Implement deterministic secondary sorting for same-block transactions (AC: #2)
  - [x] 1.1: Analyze transaction properties for secondary sort key candidates (`txHash`, `nonce`, `timestamp`)
  - [x] 1.2: Update `listOperations.ts` sort function to use secondary key when block heights are equal
  - [x] 1.3: Use `txHash` as secondary sort key (deterministic, unique per transaction)
  - [x] 1.4: Document secondary sort key choice in code comments

- [x] Task 2: Fix pagination cursor to handle same-block transactions (AC: #3)
  - [x] 2.1: Analyze current cursor logic (`block.height.toString()`) for edge cases
  - [x] 2.2: Update cursor format to include secondary key: `{height}:{txHash}` or `{height}:{index}`
  - [x] 2.3: Update cursor parsing in `listOperations()` to extract both height and secondary key
  - [x] 2.4: Update filter logic to properly exclude already-fetched transactions in same block
  - [x] 2.5: Ensure no gaps: when cursor points to a block, include all transactions at lower heights

- [x] Task 3: Add unit tests for deterministic sorting (AC: #1, #2)
  - [x] 3.1: Test sorting by block height (descending order - most recent first)
  - [x] 3.2: Test sorting by block height (ascending order - oldest first)
  - [x] 3.3: Test same-block transactions are deterministically ordered by secondary key
  - [x] 3.4: Test that repeated calls with same data return identical ordering

- [x] Task 4: Add unit tests for pagination consistency (AC: #3)
  - [x] 4.1: Test multi-page fetch with transactions spread across different blocks
  - [x] 4.2: Test multi-page fetch with multiple transactions in the same block
  - [x] 4.3: Verify no duplicates when combining pages (simulate using returned cursors)
  - [x] 4.4: Verify no gaps when combining pages (all transactions accounted for)

- [x] Task 5: Add integration tests for sorting behavior (AC: #1, #2, #3)
  - [x] 5.1: Test `listOperations()` returns operations in correct order (most recent first by default)
  - [x] 5.2: Test pagination with real mainnet address - verify no duplicates across pages
  - [x] 5.3: Test `order: "asc"` returns oldest first
  - [x] 5.4: Verify same-block transactions are consistently ordered across repeated calls

- [x] Task 6: Document sort order convention (AC: #1)
  - [x] 6.1: Add JSDoc to `listOperations()` explaining sort order convention
  - [x] 6.2: Document that `order: "desc"` (default) = most recent first
  - [x] 6.3: Document secondary sort key for same-block determinism

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** No changes to mapper functions required. Sorting is handled in `listOperations()` orchestration layer.

**ADR-002 (State Mapping):** Not applicable to this story.

**ADR-003 (Error Handling):** No new error handling required. Existing validation is sufficient.

**ADR-004 (Token Handling):** Sorting applies equally to EGLD and ESDT operations. The merged array from Story 2.2 is sorted as a single collection.

**ADR-005 (Test Structure):** Add tests to existing files `listOperations.test.ts` and `index.integ.test.ts`.

### Technical Requirements

**Current Sorting Implementation (from Story 2.1/2.2):**

The current `listOperations.ts` sorts by block height only:

```typescript
const sortedTransactions = [...allTransactions].sort((a, b) => {
  const heightA = a.round ?? a.blockHeight ?? 0;
  const heightB = b.round ?? b.blockHeight ?? 0;
  return order === "asc" ? heightA - heightB : heightB - heightA;
});
```

**Problem:** When multiple transactions have the same block height, their relative order is undefined (JavaScript sort is not stable for equal elements in all engines).

**Solution:** Add secondary sort key (`txHash`) for deterministic ordering:

```typescript
const sortedTransactions = [...allTransactions].sort((a, b) => {
  const heightA = a.round ?? a.blockHeight ?? 0;
  const heightB = b.round ?? b.blockHeight ?? 0;
  
  // Primary sort: by block height
  if (heightA !== heightB) {
    return order === "asc" ? heightA - heightB : heightB - heightA;
  }
  
  // Secondary sort: by txHash for deterministic ordering within same block
  const hashA = a.txHash ?? "";
  const hashB = b.txHash ?? "";
  return hashA.localeCompare(hashB);
});
```

**Cursor Format Enhancement:**

Current cursor: `"12345678"` (block height only)

**Problem:** If multiple transactions are in block 12345678, using height alone as cursor causes issues:
- Duplicates: Same transactions may be returned on next page
- Gaps: Transactions at same height after cursor might be skipped

**Enhanced cursor format:** `"12345678:abc123def456"` (height:txHash)

```typescript
// Generating cursor
const lastTx = limitedTransactions[limitedTransactions.length - 1];
const lastHeight = lastTx.round ?? lastTx.blockHeight ?? 0;
const lastHash = lastTx.txHash ?? "";
nextCursor = `${lastHeight}:${lastHash}`;

// Parsing cursor
if (pagingToken) {
  const [cursorHeightStr, cursorHash] = pagingToken.split(":");
  const cursorHeight = parseInt(cursorHeightStr, 10);
  
  if (!isNaN(cursorHeight)) {
    cursorFiltered = filteredByHeight.filter(tx => {
      const height = tx.round ?? tx.blockHeight ?? 0;
      const hash = tx.txHash ?? "";
      
      if (order === "asc") {
        // Include transactions AFTER the cursor position
        return height > cursorHeight || 
               (height === cursorHeight && hash > (cursorHash ?? ""));
      } else {
        // Include transactions BEFORE the cursor position
        return height < cursorHeight || 
               (height === cursorHeight && hash < (cursorHash ?? ""));
      }
    });
  }
}
```

**MultiversX Transaction Properties Available for Sorting:**

| Property | Type | Notes |
|----------|------|-------|
| `round` or `blockHeight` | number | Block height (primary key) |
| `txHash` | string | Transaction hash (unique, deterministic) |
| `nonce` | number | Sender's transaction sequence (not unique across addresses) |
| `timestamp` | number | Unix timestamp (seconds) - may have duplicates |

**Recommendation:** Use `txHash` as secondary key because:
- Guaranteed unique per transaction
- Deterministic (same hash always compares the same)
- Available on all transaction types (EGLD and ESDT)

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- Native JavaScript `Array.sort()` with custom comparator
- `String.localeCompare()` for deterministic string comparison
- `String.split()` and `parseInt()` for cursor parsing

### File Structure Requirements

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/listOperations.ts` | Add secondary sorting, enhance cursor format |
| `libs/coin-modules/coin-multiversx/src/logic/listOperations.test.ts` | Add sorting and pagination consistency tests |
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Add sorting integration tests |

**No New Files Required:**

This story enhances existing functionality - no new files needed.

### Existing Code to Leverage

**Current `listOperations()` implementation (from Story 2.1/2.2):**

Located at `libs/coin-modules/coin-multiversx/src/logic/listOperations.ts`:
- Already handles pagination with `limit`, `minHeight`, `order`, `pagingToken`
- Already fetches and merges EGLD + ESDT transactions
- Already deduplicates transactions by `txHash`
- Sorts by block height (needs enhancement for same-block determinism)

**Transaction type from `types.ts`:**

```typescript
interface MultiversXApiTransaction {
  txHash?: string;
  round?: number;           // Block height (primary name)
  blockHeight?: number;     // Alternative block height field
  timestamp?: number;       // Unix timestamp
  sender?: string;
  receiver?: string;
  value?: string | BigNumber;
  fee?: string | BigNumber;
  status?: string;
  transfer?: MultiversXTransferOptions;
  tokenIdentifier?: string;
  tokenValue?: string;
  // ...
}
```

### Import Pattern

No new imports required. Continue using existing patterns:

```typescript
import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/types";

import { isValidAddress } from "../logic";
import { mapToOperation } from "./mappers";

import type { ESDTToken, MultiversXApiTransaction } from "../types";
import { MultiversXTransferOptions } from "../types";
```

### Testing Requirements

**Unit Tests (`src/logic/listOperations.test.ts`):**

```typescript
describe("listOperations - sorting", () => {
  describe("block height ordering", () => {
    it("sorts by block height descending by default (most recent first)", async () => {
      const mockApiClient = {
        getHistory: jest.fn().mockResolvedValue([
          { txHash: "tx1", round: 100, sender: "erd1...", receiver: "erd1...", value: "1" },
          { txHash: "tx2", round: 300, sender: "erd1...", receiver: "erd1...", value: "2" },
          { txHash: "tx3", round: 200, sender: "erd1...", receiver: "erd1...", value: "3" },
        ]),
        getESDTTokensForAddress: jest.fn().mockResolvedValue([]),
        getESDTTransactionsForAddress: jest.fn().mockResolvedValue([]),
      };
      
      const [operations] = await listOperations(mockApiClient, "erd1...", { order: "desc" });
      
      expect(operations[0].tx.block.height).toBe(300);
      expect(operations[1].tx.block.height).toBe(200);
      expect(operations[2].tx.block.height).toBe(100);
    });

    it("sorts by block height ascending when order is 'asc' (oldest first)", async () => {
      // Similar test with order: "asc"
    });
  });

  describe("same-block determinism", () => {
    it("sorts transactions in same block by txHash for deterministic ordering", async () => {
      const mockApiClient = {
        getHistory: jest.fn().mockResolvedValue([
          { txHash: "zzz", round: 100, sender: "erd1...", receiver: "erd1...", value: "1" },
          { txHash: "aaa", round: 100, sender: "erd1...", receiver: "erd1...", value: "2" },
          { txHash: "mmm", round: 100, sender: "erd1...", receiver: "erd1...", value: "3" },
        ]),
        getESDTTokensForAddress: jest.fn().mockResolvedValue([]),
        getESDTTransactionsForAddress: jest.fn().mockResolvedValue([]),
      };
      
      const [operations] = await listOperations(mockApiClient, "erd1...", {});
      
      // All in same block, should be sorted by txHash alphabetically
      expect(operations[0].id).toBe("aaa");
      expect(operations[1].id).toBe("mmm");
      expect(operations[2].id).toBe("zzz");
    });

    it("returns identical ordering on repeated calls with same data", async () => {
      // Call twice, compare results
    });
  });
});

describe("listOperations - pagination consistency", () => {
  it("returns no duplicates when fetching multiple pages", async () => {
    const mockApiClient = {
      getHistory: jest.fn().mockResolvedValue([
        { txHash: "tx5", round: 500, sender: "erd1...", receiver: "erd1...", value: "5" },
        { txHash: "tx4", round: 400, sender: "erd1...", receiver: "erd1...", value: "4" },
        { txHash: "tx3", round: 300, sender: "erd1...", receiver: "erd1...", value: "3" },
        { txHash: "tx2", round: 200, sender: "erd1...", receiver: "erd1...", value: "2" },
        { txHash: "tx1", round: 100, sender: "erd1...", receiver: "erd1...", value: "1" },
      ]),
      getESDTTokensForAddress: jest.fn().mockResolvedValue([]),
      getESDTTransactionsForAddress: jest.fn().mockResolvedValue([]),
    };
    
    // Fetch page 1
    const [page1, cursor1] = await listOperations(mockApiClient, "erd1...", { limit: 2 });
    expect(page1).toHaveLength(2);
    expect(cursor1).not.toBe("");
    
    // Fetch page 2 using cursor
    const [page2, cursor2] = await listOperations(mockApiClient, "erd1...", { limit: 2, pagingToken: cursor1 });
    expect(page2).toHaveLength(2);
    
    // Verify no duplicates
    const allIds = [...page1.map(op => op.id), ...page2.map(op => op.id)];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it("handles same-block transactions across pagination boundary", async () => {
    const mockApiClient = {
      getHistory: jest.fn().mockResolvedValue([
        { txHash: "tx3", round: 100, sender: "erd1...", receiver: "erd1...", value: "3" },
        { txHash: "tx2", round: 100, sender: "erd1...", receiver: "erd1...", value: "2" },
        { txHash: "tx1", round: 100, sender: "erd1...", receiver: "erd1...", value: "1" },
      ]),
      getESDTTokensForAddress: jest.fn().mockResolvedValue([]),
      getESDTTransactionsForAddress: jest.fn().mockResolvedValue([]),
    };
    
    // Fetch page 1 (limit 2)
    const [page1, cursor1] = await listOperations(mockApiClient, "erd1...", { limit: 2 });
    expect(page1).toHaveLength(2);
    
    // Fetch page 2
    const [page2, _] = await listOperations(mockApiClient, "erd1...", { limit: 2, pagingToken: cursor1 });
    expect(page2).toHaveLength(1);
    
    // Verify no duplicates and no gaps
    const allIds = [...page1.map(op => op.id), ...page2.map(op => op.id)];
    expect(allIds).toEqual(["tx1", "tx2", "tx3"]); // Sorted by txHash
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("MultiversX API Integration", () => {
  describe("listOperations - sorting", () => {
    it("returns operations sorted by block height (most recent first)", async () => {
      const api = createApi();
      const [operations] = await api.listOperations(
        "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        { limit: 20 }
      );
      
      // Verify descending order
      for (let i = 1; i < operations.length; i++) {
        expect(operations[i - 1].tx.block.height).toBeGreaterThanOrEqual(
          operations[i].tx.block.height
        );
      }
    });

    it("returns operations sorted ascending when order is 'asc'", async () => {
      const api = createApi();
      const [operations] = await api.listOperations(
        "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        { limit: 20, order: "asc" }
      );
      
      // Verify ascending order
      for (let i = 1; i < operations.length; i++) {
        expect(operations[i - 1].tx.block.height).toBeLessThanOrEqual(
          operations[i].tx.block.height
        );
      }
    });

    it("paginated results have no duplicates", async () => {
      const api = createApi();
      
      // Fetch page 1
      const [page1, cursor1] = await api.listOperations(
        "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        { limit: 10 }
      );
      
      if (cursor1) {
        // Fetch page 2
        const [page2] = await api.listOperations(
          "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
          { limit: 10, pagingToken: cursor1 }
        );
        
        // Verify no duplicates
        const page1Ids = new Set(page1.map(op => op.id));
        for (const op of page2) {
          expect(page1Ids.has(op.id)).toBe(false);
        }
      }
    });

    it("returns consistent ordering across repeated calls", async () => {
      const api = createApi();
      const address = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
      
      const [result1] = await api.listOperations(address, { limit: 20 });
      const [result2] = await api.listOperations(address, { limit: 20 });
      
      expect(result1.map(op => op.id)).toEqual(result2.map(op => op.id));
    });
  });
});
```

**Test Addresses:**

Use known MultiversX mainnet addresses:
- Active address: `erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th` (has transaction history)

### Project Structure Notes

**Alignment with Unified Project Structure:**

- Extends existing `src/logic/listOperations.ts` following established patterns
- Unit tests co-located in same folder
- Integration tests in single `index.integ.test.ts` file (ADR-005)

**Sort Order Convention:**

Document in JSDoc:
- Default `order: "desc"` = most recent first (highest block height first)
- `order: "asc"` = oldest first (lowest block height first)
- Within same block: alphabetical by txHash (deterministic)

### Previous Story Intelligence

**From Story 2.1 (List Operations with Pagination):**

- `listOperations()` created with basic sorting by block height
- Pagination implemented with `limit`, `minHeight`, `order`, `pagingToken`
- Cursor uses block height as string
- Unit tests: 15 tests, Integration tests: 9 tests

**From Story 2.2 (EGLD and ESDT Operations):**

- Added ESDT transaction fetching and merging
- Added deduplication by `txHash` (can leverage for secondary sort key)
- Parallel fetching with `Promise.allSettled`
- Unit tests: 12 new tests, Integration tests: 6 new tests

**Key Learnings:**

1. Deduplication already uses `txHash` - same key can be secondary sort key
2. Current cursor (`block.height.toString()`) insufficient for same-block transactions
3. Need to enhance cursor format to include secondary key

### Git Intelligence Summary

**Recent Commits Analysis:**

From Epic 2 implementation:
- `listOperations.ts` established with pagination and ESDT merging
- Sorting by block height already implemented
- Cursor-based pagination using block height
- Deduplication using `txHash` (can reuse for sorting)

**Code Patterns Established:**

- Sort comparator pattern with primary/secondary keys
- Cursor format: simple string that can be parsed
- Filter functions for pagination boundaries
- Unit tests with mocked API client

### Latest Tech Information

**JavaScript Sort Stability:**

- ES2019 guarantees stable sort for `Array.sort()` in V8/SpiderMonkey
- However, older engines or edge cases may not be stable
- Using explicit secondary key guarantees determinism regardless of engine

**MultiversX Block Time:**

- Blocks produced approximately every 6 seconds
- Multiple transactions per block are common
- Same-block ordering is important for user experience

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] - Original story definition and acceptance criteria
- [Source: _bmad-output/implementation-artifacts/2-1-list-operations-with-pagination.md] - Previous story implementation details
- [Source: _bmad-output/implementation-artifacts/2-2-egld-and-esdt-operations.md] - ESDT merging and deduplication patterns
- [Source: libs/coin-modules/coin-multiversx/src/logic/listOperations.ts] - Current implementation to enhance
- [Source: _bmad-output/project-context.md] - Project context and implementation rules
- [Source: _bmad-output/implementation-artifacts/tech-spec-alpaca-api-coin-multiversx.md] - Technical specification

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

None - implementation completed without errors.

### Completion Notes List

- **Task 1 Complete:** Implemented deterministic secondary sorting using `txHash` as secondary key. Sort comparator now uses `String.localeCompare()` for consistent alphabetical ordering when block heights are equal.

- **Task 2 Complete:** Enhanced cursor format from `{height}` to `{height}:{txHash}`. Updated cursor parsing to extract both components. Filter logic now handles both DESC and ASC pagination correctly: for same-block transactions, cursor comparison uses the secondary hash to determine which transactions come "after" the cursor position. Backward compatibility maintained for legacy cursor format (height only).

- **Task 3 Complete:** Added 4 new unit tests for deterministic sorting:
  - `sorts transactions in same block by txHash alphabetically for deterministic ordering`
  - `applies secondary txHash sort only when block heights are equal`
  - `returns identical ordering on repeated calls with same data`
  - `maintains secondary sort in ascending order`

- **Task 4 Complete:** Added 6 new unit tests for pagination consistency:
  - `returns no duplicates when fetching multiple pages with same-block transactions`
  - `handles same-block transactions across pagination boundary correctly`
  - `cursor format includes block height and txHash`
  - `handles legacy cursor format (height only) for backward compatibility`
  - `multi-page fetch with transactions spread across different blocks`
  - `ascending order pagination with same-block transactions`

- **Task 5 Complete:** Added 8 new integration tests against real mainnet:
  - `returns operations sorted by block height descending (most recent first)`
  - `returns operations sorted by block height ascending (oldest first) when order is 'asc'`
  - `returns consistent ordering across repeated calls`
  - `transactions in same block are deterministically ordered`
  - `paginated results have no duplicates across pages`
  - `paginated results maintain proper block height ordering across pages`
  - `cursor format is height:txHash for precise positioning`
  - `paginated ascending order maintains no gaps or duplicates`

- **Task 6 Complete:** Added comprehensive JSDoc documentation to `listOperations()` explaining:
  - Sort order convention (desc = most recent first, asc = oldest first)
  - Secondary sort key (txHash) for same-block determinism
  - Code comments throughout explaining the sorting and cursor logic

### Test Results

- **Unit Tests:** 50 tests in listOperations.test.ts (includes 8 new edge case tests from review)
- **Integration Tests:** 36 passed (8 sorting tests + existing tests)

### File List

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/listOperations.ts` | Enhanced sorting with secondary txHash key, enhanced cursor format with height:hash, backward-compatible cursor parsing |
| `libs/coin-modules/coin-multiversx/src/logic/listOperations.test.ts` | Added unit tests for sorting and pagination consistency |
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Added integration tests for sorting behavior |
| `libs/coin-modules/coin-multiversx/jest.config.js` | Modified (from previous stories) |
| `libs/coin-modules/coin-multiversx/package.json` | Modified (from previous stories) |
| `libs/coin-modules/coin-multiversx/src/api/index.ts` | Modified (from previous stories) |

### Change Log

**2026-01-30:** Story 2.3 - Operations Sorting implementation complete
- Implemented deterministic secondary sorting by txHash for same-block transactions
- Enhanced cursor format to `{height}:{txHash}` for precise pagination positioning
- Maintained backward compatibility with legacy height-only cursor format
- Added comprehensive unit and integration tests validating all acceptance criteria

**2026-01-30:** Code Review Fixes Applied
- Fixed: Removed redundant ternary in minHeight filter (was same expression for both branches)
- Fixed: Added comment explaining secondary sort is always alphabetical regardless of order direction
- Fixed: Integration test cursor regex now case-insensitive for hex characters
- Added: 5 new edge case tests for missing/undefined txHash handling
- Added: 3 new tests for cursor edge cases (trailing colon, only colon, multiple colons)
- Updated: File List to include all modified files from git status
