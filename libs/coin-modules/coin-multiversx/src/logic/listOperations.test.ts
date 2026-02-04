import BigNumber from "bignumber.js";

import { listOperations } from "./listOperations";
import type { ESDTToken, MultiversXApiTransaction } from "../types";
import { MultiversXTransferOptions } from "../types";

// Mock API client type (extended for ESDT support - Task 2)
type MockApiClient = {
  getHistory: jest.Mock<Promise<MultiversXApiTransaction[]>, [string, number]>;
  getESDTTokensForAddress: jest.Mock<Promise<ESDTToken[]>, [string]>;
  getESDTTransactionsForAddress: jest.Mock<
    Promise<MultiversXApiTransaction[]>,
    [string, string, number]
  >;
};

describe("listOperations", () => {
  const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const otherAddress = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

  const createMockTransaction = (
    overrides: Partial<MultiversXApiTransaction> = {},
  ): MultiversXApiTransaction => ({
    mode: "send",
    fees: new BigNumber("50000000000000"),
    txHash: `tx-${Math.random().toString(36).substring(7)}`,
    sender: otherAddress,
    receiver: testAddress,
    value: new BigNumber("1000000000000000000"),
    round: 12345678,
    timestamp: 1700000000,
    status: "success",
    gasLimit: 50000,
    ...overrides,
  });

  const createMockApiClient = (
    transactions: MultiversXApiTransaction[] = [],
    tokens: ESDTToken[] = [],
    tokenTransactions: Record<string, MultiversXApiTransaction[]> = {},
  ): MockApiClient => ({
    getHistory: jest.fn().mockResolvedValue(transactions),
    getESDTTokensForAddress: jest.fn().mockResolvedValue(tokens),
    getESDTTransactionsForAddress: jest.fn().mockImplementation((_, tokenId) => {
      return Promise.resolve(tokenTransactions[tokenId] ?? []);
    }),
  });

  describe("pagination with limit parameter", () => {
    it("returns paginated operations with limit", async () => {
      const transactions = Array.from({ length: 20 }, (_, i) =>
        createMockTransaction({ txHash: `tx-${i}`, round: 1000 + i }),
      );
      const mockApiClient = createMockApiClient(transactions);

      const [operations, nextCursor] = await listOperations(mockApiClient, testAddress, {
        limit: 10,
      });

      expect(operations).toHaveLength(10);
      expect(typeof nextCursor).toBe("string");
    });

    it("returns all operations when limit is not specified", async () => {
      const transactions = Array.from({ length: 5 }, (_, i) =>
        createMockTransaction({ txHash: `tx-${i}`, round: 1000 + i }),
      );
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations).toHaveLength(5);
    });

    it("returns fewer operations when total is less than limit", async () => {
      const transactions = Array.from({ length: 3 }, (_, i) =>
        createMockTransaction({ txHash: `tx-${i}`, round: 1000 + i }),
      );
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { limit: 10 });

      expect(operations).toHaveLength(3);
    });
  });

  describe("empty results", () => {
    it("returns empty array for address with no transactions", async () => {
      const mockApiClient = createMockApiClient([]);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations).toEqual([]);
    });

    it("returns empty string cursor for empty results", async () => {
      const mockApiClient = createMockApiClient([]);

      const [, nextCursor] = await listOperations(mockApiClient, testAddress, {});

      expect(nextCursor).toBe("");
    });
  });

  describe("address validation", () => {
    it("throws error for invalid address format", async () => {
      const mockApiClient = createMockApiClient([]);

      await expect(listOperations(mockApiClient, "invalid-address", {})).rejects.toThrow(
        /Invalid MultiversX address/,
      );
    });

    it("throws error with descriptive message for invalid address", async () => {
      const mockApiClient = createMockApiClient([]);
      const invalidAddress = "not-a-valid-erd-address";

      await expect(listOperations(mockApiClient, invalidAddress, {})).rejects.toThrow(
        `Invalid MultiversX address: ${invalidAddress}`,
      );
    });
  });

  describe("next cursor generation", () => {
    it("generates next cursor from last operation block height", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 1000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
        createMockTransaction({ txHash: "tx-3", round: 3000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [, nextCursor] = await listOperations(mockApiClient, testAddress, { limit: 3 });

      // Next cursor should be based on last operation's block height
      expect(nextCursor).toBeDefined();
      expect(typeof nextCursor).toBe("string");
    });

    it("returns empty string cursor when no more pages", async () => {
      const transactions = [createMockTransaction({ txHash: "tx-1", round: 1000 })];
      const mockApiClient = createMockApiClient(transactions);

      // Get all operations, no more to fetch
      const [, nextCursor] = await listOperations(mockApiClient, testAddress, { limit: 10 });

      // When fewer results than limit, no more pages
      expect(nextCursor).toBe("");
    });
  });

  describe("operation mapping", () => {
    it("correctly maps transactions to Operation objects", async () => {
      const transactions = [
        createMockTransaction({
          txHash: "test-hash-123",
          value: new BigNumber("5000000000000000000"),
          sender: otherAddress,
          receiver: testAddress,
          round: 12345,
          timestamp: 1700000000,
        }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations[0]).toMatchObject({
        id: "test-hash-123",
        type: "IN",
        value: 5000000000000000000n,
        asset: { type: "native" },
        senders: [otherAddress],
        recipients: [testAddress],
      });
    });

    it("maps OUT operations correctly for sender address", async () => {
      const transactions = [
        createMockTransaction({
          sender: testAddress,
          receiver: otherAddress,
        }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations[0].type).toBe("OUT");
    });
  });

  describe("API client interaction", () => {
    it("calls apiClient.getHistory with correct address and startAt", async () => {
      const mockApiClient = createMockApiClient([]);

      await listOperations(mockApiClient, testAddress, {});

      expect(mockApiClient.getHistory).toHaveBeenCalledWith(testAddress, 0);
    });

    it("fetches from timestamp 0 and filters by minHeight client-side", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 1000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
        createMockTransaction({ txHash: "tx-3", round: 3000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { minHeight: 1500 });

      // Should call with startAt=0 (fetch all, filter client-side)
      expect(mockApiClient.getHistory).toHaveBeenCalledWith(testAddress, 0);
      // Should filter out transactions below minHeight (1000 < 1500)
      expect(operations).toHaveLength(2);
      expect(operations.map(op => op.tx.block.height)).toEqual([3000, 2000]);
    });
  });

  describe("pagingToken cursor-based pagination", () => {
    it("skips operations at or above cursor height in desc order", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 1000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
        createMockTransaction({ txHash: "tx-3", round: 3000 }),
        createMockTransaction({ txHash: "tx-4", round: 4000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Get second page using cursor from first page (pagingToken = "3000")
      const [operations] = await listOperations(mockApiClient, testAddress, {
        pagingToken: "3000",
        order: "desc",
      });

      // Should only return operations with height < 3000
      expect(operations.map(op => op.tx.block.height)).toEqual([2000, 1000]);
    });

    it("skips operations at or below cursor height in asc order", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 1000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
        createMockTransaction({ txHash: "tx-3", round: 3000 }),
        createMockTransaction({ txHash: "tx-4", round: 4000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Get second page using cursor (pagingToken = "2000")
      const [operations] = await listOperations(mockApiClient, testAddress, {
        pagingToken: "2000",
        order: "asc",
      });

      // Should only return operations with height > 2000
      expect(operations.map(op => op.tx.block.height)).toEqual([3000, 4000]);
    });

    it("ignores invalid pagingToken and returns all results", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 1000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {
        pagingToken: "invalid-not-a-number",
      });

      expect(operations).toHaveLength(2);
    });

    it("combines pagingToken with limit for proper pagination", async () => {
      const transactions = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction({ txHash: `tx-${i}`, round: 1000 + i * 100 }),
      );
      const mockApiClient = createMockApiClient(transactions);

      // First page
      const [firstPage, firstCursor] = await listOperations(mockApiClient, testAddress, {
        limit: 3,
        order: "desc",
      });
      expect(firstPage).toHaveLength(3);
      expect(firstPage.map(op => op.tx.block.height)).toEqual([1900, 1800, 1700]);

      // Second page using cursor from first page
      const [secondPage] = await listOperations(mockApiClient, testAddress, {
        limit: 3,
        pagingToken: firstCursor,
        order: "desc",
      });
      expect(secondPage).toHaveLength(3);
      expect(secondPage.map(op => op.tx.block.height)).toEqual([1600, 1500, 1400]);
    });
  });

  describe("sorting", () => {
    it("returns operations in descending order by default (newest first)", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-old", round: 1000, timestamp: 1600000000 }),
        createMockTransaction({ txHash: "tx-new", round: 3000, timestamp: 1800000000 }),
        createMockTransaction({ txHash: "tx-mid", round: 2000, timestamp: 1700000000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { order: "desc" });

      // Should be sorted by block height descending
      expect(operations[0].tx.block.height).toBe(3000);
      expect(operations[1].tx.block.height).toBe(2000);
      expect(operations[2].tx.block.height).toBe(1000);
    });

    it("returns operations in ascending order when specified", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-new", round: 3000 }),
        createMockTransaction({ txHash: "tx-old", round: 1000 }),
        createMockTransaction({ txHash: "tx-mid", round: 2000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { order: "asc" });

      // Should be sorted by block height ascending
      expect(operations[0].tx.block.height).toBe(1000);
      expect(operations[1].tx.block.height).toBe(2000);
      expect(operations[2].tx.block.height).toBe(3000);
    });
  });

  // Story 2.3: Deterministic secondary sorting for same-block transactions
  describe("sorting - same-block determinism (Story 2.3, AC: #2)", () => {
    it("sorts transactions in same block by txHash alphabetically for deterministic ordering", async () => {
      const transactions = [
        createMockTransaction({ txHash: "zzz-hash", round: 100 }),
        createMockTransaction({ txHash: "aaa-hash", round: 100 }),
        createMockTransaction({ txHash: "mmm-hash", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      // All in same block, should be sorted by txHash alphabetically
      expect(operations[0].id).toBe("aaa-hash");
      expect(operations[1].id).toBe("mmm-hash");
      expect(operations[2].id).toBe("zzz-hash");
    });

    it("applies secondary txHash sort only when block heights are equal", async () => {
      const transactions = [
        createMockTransaction({ txHash: "aaa-hash", round: 200 }), // Higher block, comes first in desc
        createMockTransaction({ txHash: "zzz-hash", round: 100 }), // Lower block
        createMockTransaction({ txHash: "mmm-hash", round: 100 }), // Same block as zzz, but alphabetically before
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { order: "desc" });

      // Block 200 first, then block 100 sorted by hash
      expect(operations[0].tx.block.height).toBe(200);
      expect(operations[0].id).toBe("aaa-hash");
      expect(operations[1].tx.block.height).toBe(100);
      expect(operations[1].id).toBe("mmm-hash");
      expect(operations[2].tx.block.height).toBe(100);
      expect(operations[2].id).toBe("zzz-hash");
    });

    it("returns identical ordering on repeated calls with same data", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-c", round: 100 }),
        createMockTransaction({ txHash: "tx-a", round: 100 }),
        createMockTransaction({ txHash: "tx-b", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Call twice
      const [operations1] = await listOperations(mockApiClient, testAddress, {});
      const [operations2] = await listOperations(mockApiClient, testAddress, {});

      // Should have identical ordering
      expect(operations1.map(op => op.id)).toEqual(operations2.map(op => op.id));
      expect(operations1.map(op => op.id)).toEqual(["tx-a", "tx-b", "tx-c"]);
    });

    it("maintains secondary sort in ascending order", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-z", round: 100 }),
        createMockTransaction({ txHash: "tx-a", round: 100 }),
        createMockTransaction({ txHash: "tx-m", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { order: "asc" });

      // Same block, sorted by txHash alphabetically (secondary sort is always alphabetical)
      expect(operations.map(op => op.id)).toEqual(["tx-a", "tx-m", "tx-z"]);
    });

    it("secondary sort is always alphabetical regardless of primary order direction", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-z", round: 100 }),
        createMockTransaction({ txHash: "tx-a", round: 100 }),
        createMockTransaction({ txHash: "tx-m", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Both desc and asc should have same secondary sort order (alphabetical)
      const [descOps] = await listOperations(mockApiClient, testAddress, { order: "desc" });
      const [ascOps] = await listOperations(mockApiClient, testAddress, { order: "asc" });

      // Secondary sort is alphabetical in both cases
      expect(descOps.map(op => op.id)).toEqual(["tx-a", "tx-m", "tx-z"]);
      expect(ascOps.map(op => op.id)).toEqual(["tx-a", "tx-m", "tx-z"]);
    });

    it("handles transactions with undefined txHash gracefully", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-b", round: 100 }),
        createMockTransaction({ txHash: undefined, round: 100 }),
        createMockTransaction({ txHash: "tx-a", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      // Undefined txHash becomes empty string "", which sorts before "tx-a"
      expect(operations).toHaveLength(3);
      // Empty string sorts first alphabetically
      expect(operations[0].id).toBe("");
      expect(operations[1].id).toBe("tx-a");
      expect(operations[2].id).toBe("tx-b");
    });

    it("handles transactions with empty string txHash", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-a", round: 100 }),
        createMockTransaction({ txHash: "", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      // Empty string sorts before "tx-a"
      expect(operations[0].id).toBe("");
      expect(operations[1].id).toBe("tx-a");
    });

    it("handles transactions with missing round AND blockHeight (fallback to 0)", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 100 }),
        { ...createMockTransaction({ txHash: "tx-2" }), round: undefined, blockHeight: undefined },
        createMockTransaction({ txHash: "tx-3", round: 50 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { order: "desc" });

      // Transaction with undefined height falls back to 0, which is lowest
      expect(operations[0].tx.block.height).toBe(100);
      expect(operations[1].tx.block.height).toBe(50);
      expect(operations[2].tx.block.height).toBe(0); // Fallback height
      expect(operations[2].id).toBe("tx-2");
    });
  });

  // Story 2.3: Pagination consistency with enhanced cursor format
  describe("pagination consistency - enhanced cursor (Story 2.3, AC: #3)", () => {
    it("returns no duplicates when fetching multiple pages with same-block transactions", async () => {
      // 5 transactions in the same block
      const transactions = [
        createMockTransaction({ txHash: "tx-e", round: 100 }),
        createMockTransaction({ txHash: "tx-d", round: 100 }),
        createMockTransaction({ txHash: "tx-c", round: 100 }),
        createMockTransaction({ txHash: "tx-b", round: 100 }),
        createMockTransaction({ txHash: "tx-a", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Fetch page 1 - with same block, sorted by txHash alphabetically
      const [page1, cursor1] = await listOperations(mockApiClient, testAddress, { limit: 2 });
      expect(page1).toHaveLength(2);
      expect(page1.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
      expect(cursor1).not.toBe("");

      // Fetch page 2 using cursor
      const [page2, cursor2] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        pagingToken: cursor1,
      });
      expect(page2).toHaveLength(2);
      expect(page2.map(op => op.id)).toEqual(["tx-c", "tx-d"]);

      // Fetch page 3 using cursor
      const [page3] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        pagingToken: cursor2,
      });
      expect(page3).toHaveLength(1);
      expect(page3[0].id).toBe("tx-e");

      // Verify no duplicates across all pages
      const allIds = [
        ...page1.map(op => op.id),
        ...page2.map(op => op.id),
        ...page3.map(op => op.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
      expect(uniqueIds.size).toBe(5);
    });

    it("handles same-block transactions across pagination boundary correctly", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-c", round: 100 }),
        createMockTransaction({ txHash: "tx-b", round: 100 }),
        createMockTransaction({ txHash: "tx-a", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Fetch page 1 (limit 2) - sorted by txHash alphabetically within same block
      const [page1, cursor1] = await listOperations(mockApiClient, testAddress, { limit: 2 });
      expect(page1).toHaveLength(2);
      expect(page1.map(op => op.id)).toEqual(["tx-a", "tx-b"]);

      // Cursor should include txHash for precise positioning (last item is tx-b)
      expect(cursor1).toBe("100:tx-b");

      // Fetch page 2 - should get remaining transaction after tx-b
      const [page2] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        pagingToken: cursor1,
      });
      expect(page2).toHaveLength(1);
      expect(page2[0].id).toBe("tx-c");
    });

    it("cursor format includes block height and txHash", async () => {
      const transactions = [
        createMockTransaction({ txHash: "specific-hash-123", round: 5678 }),
        createMockTransaction({ txHash: "another-hash-456", round: 1234 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // With desc order (default), higher block height comes first
      // With limit: 1, we get the first transaction (5678) and cursor points to it
      const [page, cursor] = await listOperations(mockApiClient, testAddress, { limit: 1 });

      // First page should have the higher block height transaction
      expect(page[0].tx.block.height).toBe(5678);
      expect(page[0].id).toBe("specific-hash-123");

      // Cursor should be in format "{height}:{txHash}"
      expect(cursor).toBe("5678:specific-hash-123");
    });

    it("handles legacy cursor format (height only) for backward compatibility", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 3000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
        createMockTransaction({ txHash: "tx-3", round: 1000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Use legacy cursor format (height only, no colon)
      const [operations] = await listOperations(mockApiClient, testAddress, {
        pagingToken: "2000",
        order: "desc",
      });

      // Should work with legacy format - return operations below height 2000
      expect(operations.map(op => op.tx.block.height)).toEqual([1000]);
    });

    it("handles cursor with trailing colon gracefully", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 3000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Cursor with trailing colon (empty hash component)
      const [operations] = await listOperations(mockApiClient, testAddress, {
        pagingToken: "2000:",
        order: "desc",
      });

      // Should treat empty hash as valid - returns items after cursor position
      // height < 2000 OR (height === 2000 AND hash > "")
      // All hashes are > "", so tx-2 at height 2000 is included
      expect(operations.map(op => op.id)).toContain("tx-2");
    });

    it("handles cursor with only colon gracefully", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 2000 }),
        createMockTransaction({ txHash: "tx-2", round: 1000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Cursor with only colon (empty height = NaN, skips filtering)
      const [operations] = await listOperations(mockApiClient, testAddress, {
        pagingToken: ":",
      });

      // Invalid height (NaN) causes cursor filtering to be skipped
      expect(operations).toHaveLength(2);
    });

    it("handles cursor with multiple colons correctly", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-1", round: 3000 }),
        createMockTransaction({ txHash: "tx-2", round: 2000 }),
        createMockTransaction({ txHash: "tx-3", round: 1000 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Cursor with multiple colons - only first colon is used as separator
      // "2000:abc:def" -> height=2000, hash="abc:def"
      const [operations] = await listOperations(mockApiClient, testAddress, {
        pagingToken: "2000:abc:def",
        order: "desc",
      });

      // Should parse correctly: height=2000, hash="abc:def"
      // Returns items where height < 2000 OR (height === 2000 AND hash > "abc:def")
      // "tx-2" hash is > "abc:def" alphabetically, so it's included
      expect(operations.length).toBeGreaterThanOrEqual(1);
      expect(operations.some(op => op.tx.block.height === 1000)).toBe(true);
    });

    it("multi-page fetch with transactions spread across different blocks", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-5", round: 500 }),
        createMockTransaction({ txHash: "tx-4", round: 400 }),
        createMockTransaction({ txHash: "tx-3", round: 300 }),
        createMockTransaction({ txHash: "tx-2", round: 200 }),
        createMockTransaction({ txHash: "tx-1", round: 100 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Fetch page 1
      const [page1, cursor1] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        order: "desc",
      });
      expect(page1).toHaveLength(2);
      expect(page1.map(op => op.tx.block.height)).toEqual([500, 400]);

      // Fetch page 2 using cursor
      const [page2, cursor2] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        pagingToken: cursor1,
        order: "desc",
      });
      expect(page2).toHaveLength(2);
      expect(page2.map(op => op.tx.block.height)).toEqual([300, 200]);

      // Fetch page 3
      const [page3] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        pagingToken: cursor2,
        order: "desc",
      });
      expect(page3).toHaveLength(1);
      expect(page3[0].tx.block.height).toBe(100);

      // Verify no duplicates
      const allIds = [
        ...page1.map(op => op.id),
        ...page2.map(op => op.id),
        ...page3.map(op => op.id),
      ];
      expect(new Set(allIds).size).toBe(5);
    });

    it("ascending order pagination with same-block transactions", async () => {
      const transactions = [
        createMockTransaction({ txHash: "tx-c", round: 100 }),
        createMockTransaction({ txHash: "tx-b", round: 100 }),
        createMockTransaction({ txHash: "tx-a", round: 100 }),
        createMockTransaction({ txHash: "tx-d", round: 200 }),
      ];
      const mockApiClient = createMockApiClient(transactions);

      // Fetch page 1 in ascending order
      const [page1, cursor1] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        order: "asc",
      });
      expect(page1).toHaveLength(2);
      expect(page1.map(op => op.id)).toEqual(["tx-a", "tx-b"]);

      // Fetch page 2
      const [page2, cursor2] = await listOperations(mockApiClient, testAddress, {
        limit: 2,
        pagingToken: cursor1,
        order: "asc",
      });
      expect(page2).toHaveLength(2);
      expect(page2.map(op => op.id)).toEqual(["tx-c", "tx-d"]);

      // Verify no more results
      expect(cursor2).toBe("");
    });
  });

  describe("EGLD and ESDT operations (Story 2.2)", () => {
    const createEsdtTransaction = (
      overrides: Partial<MultiversXApiTransaction> = {},
    ): MultiversXApiTransaction => ({
      mode: "send",
      fees: new BigNumber("50000000000000"),
      txHash: `esdt-tx-${Math.random().toString(36).substring(7)}`,
      sender: otherAddress,
      receiver: testAddress,
      value: new BigNumber("0"), // EGLD value is 0 for ESDT
      transfer: MultiversXTransferOptions.esdt,
      tokenIdentifier: "USDC-c76f1f",
      tokenValue: "1000000",
      round: 12345678,
      timestamp: 1700000000,
      status: "success",
      gasLimit: 50000,
      ...overrides,
    });

    it("returns both EGLD and ESDT operations in merged array (AC: #1, Subtask 6.3)", async () => {
      const egldTx = createMockTransaction({ txHash: "egld-tx-1", round: 2000 });
      const esdtTx = createEsdtTransaction({
        txHash: "esdt-tx-1",
        round: 1500,
        tokenIdentifier: "USDC-c76f1f",
        tokenValue: "1000000",
      });

      const tokens: ESDTToken[] = [{ identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" }];
      const tokenTransactions = { "USDC-c76f1f": [esdtTx] };

      const mockApiClient = createMockApiClient([egldTx], tokens, tokenTransactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations.some(op => op.asset.type === "native")).toBe(true);
      expect(operations.some(op => op.asset.type === "esdt")).toBe(true);
      expect(operations).toHaveLength(2);
    });

    it("calls getESDTTokensForAddress to get list of tokens (Subtask 3.1)", async () => {
      const tokens: ESDTToken[] = [{ identifier: "MEX-455c57", name: "MEX", balance: "5000" }];
      const mockApiClient = createMockApiClient([], tokens, {});

      await listOperations(mockApiClient, testAddress, {});

      expect(mockApiClient.getESDTTokensForAddress).toHaveBeenCalledWith(testAddress);
    });

    it("calls getESDTTransactionsForAddress for each token (Subtask 3.2)", async () => {
      const tokens: ESDTToken[] = [
        { identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" },
        { identifier: "MEX-455c57", name: "MEX", balance: "5000000" },
      ];
      const mockApiClient = createMockApiClient([], tokens, {});

      await listOperations(mockApiClient, testAddress, {});

      expect(mockApiClient.getESDTTransactionsForAddress).toHaveBeenCalledWith(
        testAddress,
        "USDC-c76f1f",
        0,
      );
      expect(mockApiClient.getESDTTransactionsForAddress).toHaveBeenCalledWith(
        testAddress,
        "MEX-455c57",
        0,
      );
    });

    it("merges EGLD and ESDT transactions correctly (Subtask 3.3)", async () => {
      const egldTxs = [
        createMockTransaction({ txHash: "egld-1", round: 3000 }),
        createMockTransaction({ txHash: "egld-2", round: 1000 }),
      ];
      const esdtTx = createEsdtTransaction({ txHash: "esdt-1", round: 2000 });

      const tokens: ESDTToken[] = [{ identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" }];
      const tokenTransactions = { "USDC-c76f1f": [esdtTx] };

      const mockApiClient = createMockApiClient(egldTxs, tokens, tokenTransactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations).toHaveLength(3);
      // Verify all transactions are present
      expect(operations.map(op => op.id)).toEqual(
        expect.arrayContaining(["egld-1", "egld-2", "esdt-1"]),
      );
    });

    it("sorts merged array by block height (desc by default) (Subtask 3.4, 6.4)", async () => {
      const egldTx = createMockTransaction({ txHash: "egld-1", round: 1000 });
      const esdtTx1 = createEsdtTransaction({ txHash: "esdt-1", round: 3000 });
      const esdtTx2 = createEsdtTransaction({
        txHash: "esdt-2",
        round: 2000,
        tokenIdentifier: "MEX-455c57",
      });

      const tokens: ESDTToken[] = [
        { identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" },
        { identifier: "MEX-455c57", name: "MEX", balance: "5000000" },
      ];
      const tokenTransactions = {
        "USDC-c76f1f": [esdtTx1],
        "MEX-455c57": [esdtTx2],
      };

      const mockApiClient = createMockApiClient([egldTx], tokens, tokenTransactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { order: "desc" });

      // Should be sorted by block height descending
      expect(operations[0].tx.block.height).toBe(3000);
      expect(operations[1].tx.block.height).toBe(2000);
      expect(operations[2].tx.block.height).toBe(1000);
    });

    it("applies pagination correctly to merged array (Subtask 3.5, 6.5)", async () => {
      const egldTxs = [
        createMockTransaction({ txHash: "egld-1", round: 5000 }),
        createMockTransaction({ txHash: "egld-2", round: 3000 }),
        createMockTransaction({ txHash: "egld-3", round: 1000 }),
      ];
      const esdtTxs = [
        createEsdtTransaction({ txHash: "esdt-1", round: 4000 }),
        createEsdtTransaction({ txHash: "esdt-2", round: 2000 }),
      ];

      const tokens: ESDTToken[] = [{ identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" }];
      const tokenTransactions = { "USDC-c76f1f": esdtTxs };

      const mockApiClient = createMockApiClient(egldTxs, tokens, tokenTransactions);

      const [operations] = await listOperations(mockApiClient, testAddress, { limit: 3 });

      expect(operations).toHaveLength(3);
      // Should be top 3 by height (desc): 5000, 4000, 3000
      expect(operations.map(op => op.tx.block.height)).toEqual([5000, 4000, 3000]);
    });

    it("returns only EGLD operations when account has no ESDT tokens (AC: #4, Subtask 3.6, 6.6)", async () => {
      const egldTxs = [
        createMockTransaction({ txHash: "egld-1", round: 2000 }),
        createMockTransaction({ txHash: "egld-2", round: 1000 }),
      ];

      // No tokens for this account
      const mockApiClient = createMockApiClient(egldTxs, [], {});

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations).toHaveLength(2);
      expect(operations.every(op => op.asset.type === "native")).toBe(true);
    });

    it("fetches ESDT transactions in parallel for performance (Subtask 3.2)", async () => {
      const tokens: ESDTToken[] = [
        { identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" },
        { identifier: "MEX-455c57", name: "MEX", balance: "5000000" },
        { identifier: "WEGLD-bd4d79", name: "WEGLD", balance: "2000000" },
      ];
      const mockApiClient = createMockApiClient([], tokens, {});

      await listOperations(mockApiClient, testAddress, {});

      // Verify all tokens were fetched
      expect(mockApiClient.getESDTTransactionsForAddress).toHaveBeenCalledTimes(3);
    });

    it("handles empty ESDT transaction results gracefully", async () => {
      const egldTx = createMockTransaction({ txHash: "egld-1", round: 1000 });
      const tokens: ESDTToken[] = [{ identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" }];

      // Token exists but has no transactions
      const mockApiClient = createMockApiClient([egldTx], tokens, { "USDC-c76f1f": [] });

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      expect(operations).toHaveLength(1);
      expect(operations[0].asset.type).toBe("native");
    });

    it("deduplicates transactions that appear in both EGLD and ESDT results", async () => {
      // Simulate real API behavior: getHistory returns ESDT transaction without transfer field
      const duplicateTxHash = "duplicate-tx-123";
      const egldVersionOfEsdtTx = createMockTransaction({
        txHash: duplicateTxHash,
        round: 2000,
        value: new BigNumber("0"), // ESDT tx has 0 EGLD value
        // No transfer field - this is how getHistory returns it
      });
      const esdtVersionOfTx = createEsdtTransaction({
        txHash: duplicateTxHash,
        round: 2000,
        tokenIdentifier: "USDC-c76f1f",
        tokenValue: "1000000",
      });

      const tokens: ESDTToken[] = [{ identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" }];
      const tokenTransactions = { "USDC-c76f1f": [esdtVersionOfTx] };

      // getHistory returns the tx without transfer field
      const mockApiClient = createMockApiClient([egldVersionOfEsdtTx], tokens, tokenTransactions);

      const [operations] = await listOperations(mockApiClient, testAddress, {});

      // Should only have 1 operation (deduplicated)
      expect(operations).toHaveLength(1);
      // Should prefer the ESDT version with correct asset type
      expect(operations[0].asset.type).toBe("esdt");
      expect((operations[0].asset as { assetReference?: string }).assetReference).toBe(
        "USDC-c76f1f",
      );
    });

    it("handles failed ESDT token fetch gracefully with Promise.allSettled", async () => {
      const egldTx = createMockTransaction({ txHash: "egld-1", round: 1000 });
      const esdtTx = createEsdtTransaction({ txHash: "esdt-1", round: 2000 });

      const tokens: ESDTToken[] = [
        { identifier: "USDC-c76f1f", name: "USDC", balance: "1000000" },
        { identifier: "FAIL-token", name: "FAIL", balance: "1000" },
      ];

      // One token fetch succeeds, one fails
      const mockApiClient = {
        getHistory: jest.fn().mockResolvedValue([egldTx]),
        getESDTTokensForAddress: jest.fn().mockResolvedValue(tokens),
        getESDTTransactionsForAddress: jest.fn().mockImplementation((_, tokenId) => {
          if (tokenId === "FAIL-token") {
            return Promise.reject(new Error("API error"));
          }
          return Promise.resolve([esdtTx]);
        }),
      };

      // Should not throw, should return successful results
      const [operations] = await listOperations(mockApiClient, testAddress, {});

      // Should have EGLD tx + successful ESDT tx (failed one is skipped)
      expect(operations.length).toBeGreaterThanOrEqual(1);
    });

    it("limits token fetching to MAX_TOKENS_TO_FETCH for performance", async () => {
      const egldTx = createMockTransaction({ txHash: "egld-1", round: 1000 });

      // Create 25 tokens (more than the limit of 20)
      const tokens: ESDTToken[] = Array.from({ length: 25 }, (_, i) => ({
        identifier: `TOKEN${i}-abc123`,
        name: `Token${i}`,
        balance: "1000",
      }));

      const mockApiClient = createMockApiClient([egldTx], tokens, {});

      await listOperations(mockApiClient, testAddress, {});

      // Should only fetch first 20 tokens (MAX_TOKENS_TO_FETCH)
      expect(mockApiClient.getESDTTransactionsForAddress).toHaveBeenCalledTimes(20);
    });
  });
});
