import { listOperations, parseCursor } from "./listOperations";

const mockGetTransactions = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

const ADDRESS = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
function baseOptions(overrides: Partial<Parameters<typeof listOperations>[1]> = {}) {
  return { minHeight: 0, ...overrides };
}

describe("parseCursor", () => {
  it("should return undefined if cursor is unknown", () => {
    const before = parseCursor(baseOptions());
    expect(before).toBe(undefined);
  });

  it("returns before if cursor is available", () => {
    const before = parseCursor(baseOptions({ cursor: "500" }));
    expect(before).toBe(500);
  });

  it("parses a real X-Next-Page-Before millisecond timestamp", () => {
    expect(parseCursor(baseOptions({ cursor: "1720440515512" }))).toBe(1720440515512);
  });

  it("treats an empty cursor as no cursor (newest page)", () => {
    expect(parseCursor(baseOptions({ cursor: "" }))).toBeUndefined();
  });

  it.each(["abc", "0", "-5"])("falls back to the newest page on an invalid cursor (%s)", cursor => {
    expect(parseCursor(baseOptions({ cursor }))).toBeUndefined();
  });

  // parseInt stops at the first non-digit, so trailing junk is tolerated. Harmless because the
  // cursor only ever comes back from our own `next` (the indexer header), but pinned here so a
  // change in parsing strategy is a deliberate decision.
  it("accepts a numeric prefix followed by junk (parseInt behaviour)", () => {
    expect(parseCursor(baseOptions({ cursor: "123abc" }))).toBe(123);
  });
});

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Minimal indexer tx: an IN of 1 sompi to ADDRESS. Its score doubles as the block time (in s)
  // so pages built from it are ordered the way the indexer orders them.
  function tx(score: number) {
    return {
      transaction_id: `tx-${score}`,
      hash: `tx-${score}`,
      block_hash: ["h"],
      block_time: score * 1000,
      accepting_block_blue_score: score,
      inputs: [],
      outputs: [{ script_public_key_address: ADDRESS, amount: 1 }],
    };
  }

  function mockPage(scores: number[], nextPageBefore: string | null) {
    mockGetTransactions.mockResolvedValueOnce({
      transactions: scores.map(tx),
      nextPageBefore,
      nextPageAfter: null,
    });
  }

  describe("request", () => {
    it("reads the newest page when there is no cursor", async () => {
      mockPage([], null);

      await listOperations(ADDRESS, baseOptions());

      expect(mockGetTransactions).toHaveBeenCalledWith(ADDRESS, {
        before: undefined,
        limit: undefined,
      });
    });

    it("resumes from the supplied cursor as `before`", async () => {
      mockPage([], null);

      await listOperations(ADDRESS, baseOptions({ cursor: "1720440515512" }));

      expect(mockGetTransactions).toHaveBeenCalledWith(ADDRESS, {
        before: 1720440515512,
        limit: undefined,
      });
    });

    it.each([undefined, "desc" as const])("accepts order %s", async order => {
      mockPage([], null);

      await expect(listOperations(ADDRESS, baseOptions({ order }))).resolves.toBeDefined();
    });

    it("rejects ascending order", async () => {
      await expect(listOperations(ADDRESS, baseOptions({ order: "asc" }))).rejects.toThrow(
        "kaspa: listOperations does not support ascending order",
      );
      expect(mockGetTransactions).not.toHaveBeenCalled();
    });
  });

  describe("limit", () => {
    it("leaves the page size to getTransactions' default when no limit is given", async () => {
      mockPage([], null);

      await listOperations(ADDRESS, baseOptions());

      expect(mockGetTransactions).toHaveBeenCalledWith(
        ADDRESS,
        expect.objectContaining({ limit: undefined }),
      );
    });

    it.each([1, 2, 500])("passes limit %i through", async limit => {
      mockPage([], null);

      await listOperations(ADDRESS, baseOptions({ limit }));

      expect(mockGetTransactions).toHaveBeenCalledWith(ADDRESS, expect.objectContaining({ limit }));
    });

    it("caps a limit above the indexer maximum at 500 (the rest follows via next)", async () => {
      mockPage([], null);

      await listOperations(ADDRESS, baseOptions({ limit: 1000 }));

      expect(mockGetTransactions).toHaveBeenCalledWith(
        ADDRESS,
        expect.objectContaining({ limit: 500 }),
      );
    });

    it("passes limit together with the before cursor", async () => {
      mockPage([], null);

      await listOperations(ADDRESS, baseOptions({ cursor: "1720440515512", limit: 2 }));

      expect(mockGetTransactions).toHaveBeenCalledWith(ADDRESS, {
        before: 1720440515512,
        limit: 2,
      });
    });

    it.each([0, -1, 1.5, Number.NaN])("rejects an invalid limit (%s)", async limit => {
      await expect(listOperations(ADDRESS, baseOptions({ limit }))).rejects.toThrow(
        "kaspa: listOperations limit must be a positive integer",
      );
      expect(mockGetTransactions).not.toHaveBeenCalled();
    });
  });

  describe("cursor", () => {
    it("propagates the indexer's next-page cursor when more pages are available", async () => {
      mockPage([], "12345");

      const page = await listOperations(ADDRESS, baseOptions());

      expect(page.next).toBe("12345");
    });

    it("returns an undefined cursor once the indexer has no further pages", async () => {
      mockPage([], null);

      const page = await listOperations(ADDRESS, baseOptions());

      expect(page.next).toBeUndefined();
    });

    it("guards an undefined transactions array before iterating", async () => {
      mockGetTransactions.mockResolvedValueOnce({
        transactions: undefined,
        nextPageBefore: null,
        nextPageAfter: null,
      });

      const page = await listOperations(ADDRESS, baseOptions());

      expect(page.items).toEqual([]);
    });
  });

  describe("mapping", () => {
    it("maps an OUT transaction to a framework Operation with value = amount (fee excluded)", async () => {
      mockGetTransactions.mockResolvedValueOnce({
        nextPageBefore: null,
        nextPageAfter: null,
        transactions: [
          {
            transaction_id: "tx-out",
            hash: "tx-out",
            block_hash: ["block-hash"],
            block_time: 1700000000000,
            accepting_block_blue_score: 100,
            inputs: [
              {
                previous_outpoint_address: ADDRESS,
                previous_outpoint_amount: 1000000,
              },
            ],
            outputs: [
              {
                script_public_key_address:
                  "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65",
                amount: 700000,
              },
              {
                script_public_key_address: ADDRESS,
                amount: 250000,
              },
            ],
          },
        ],
      });

      const page = await listOperations(ADDRESS, baseOptions());

      expect(page.items).toHaveLength(1);
      const [op] = page.items;
      expect(op.type).toBe("OUT");
      // fee = totalInput(1000000) - totalOutput(950000) = 50000; amount sent = 700000.
      // Framework Operation.value is the pure amount — the generic adapter re-adds fees for OUT.
      expect(op.tx.fees).toBe(50000n);
      expect(op.value).toBe(700000n);
      expect(op.asset).toEqual({ type: "native", name: "KAS" });
    });

    it("maps an IN transaction to a framework Operation with the received amount", async () => {
      mockGetTransactions.mockResolvedValueOnce({
        nextPageBefore: null,
        nextPageAfter: null,
        transactions: [
          {
            transaction_id: "tx-in",
            hash: "tx-in",
            block_hash: ["block-hash"],
            block_time: 1700000000000,
            accepting_block_blue_score: 200,
            inputs: [],
            outputs: [{ script_public_key_address: ADDRESS, amount: 12345 }],
          },
        ],
      });

      const page = await listOperations(ADDRESS, baseOptions());

      const [op] = page.items;
      expect(op.type).toBe("IN");
      expect(op.value).toBe(12345n);
      expect(op.tx.fees).toBe(0n);
    });
  });

  describe("minHeight filter and stop rule (one page)", () => {
    it.each([
      {
        name: "full sync, more pages",
        minHeight: 0,
        scores: [50, 40, 30],
        serverNext: "c",
        kept: [50, 40, 30],
        next: "c",
      },
      {
        name: "full sync, last page",
        minHeight: 0,
        scores: [50, 40],
        serverNext: null,
        kept: [50, 40],
        next: undefined,
      },
      {
        name: "incremental, whole page new",
        minHeight: 10,
        scores: [50, 40, 30],
        serverNext: "c",
        kept: [50, 40, 30],
        next: "c",
      },
      {
        name: "incremental, page reaches below minHeight",
        minHeight: 35,
        scores: [50, 40, 30, 20],
        serverNext: "c",
        kept: [50, 40],
        next: undefined,
      },
      {
        name: "incremental, page entirely below minHeight",
        minHeight: 100,
        scores: [50, 40],
        serverNext: "c",
        kept: [],
        next: undefined,
      },
      {
        name: "an item exactly at minHeight is kept",
        minHeight: 40,
        scores: [50, 40, 30],
        serverNext: "c",
        kept: [50, 40],
        next: undefined,
      },
      {
        name: "lowest item exactly at minHeight, nothing below",
        minHeight: 30,
        scores: [50, 40, 30],
        serverNext: "c",
        kept: [50, 40, 30],
        next: "c",
      },
      {
        name: "late-accepted tx out of order on the page",
        minHeight: 35,
        scores: [50, 20, 40],
        serverNext: "c",
        kept: [50, 40],
        next: undefined,
      },
      {
        name: "empty page, no further pages",
        minHeight: 10,
        scores: [],
        serverNext: null,
        kept: [],
        next: undefined,
      },
    ])("$name", async ({ minHeight, scores, serverNext, kept, next }) => {
      mockPage(scores, serverNext);

      const page = await listOperations(ADDRESS, baseOptions({ minHeight }));

      expect(page.items.map(op => op.tx.block.height)).toEqual(kept);
      expect(page.next).toBe(next);
      // generic-coin-framework's paginateOperations treats "empty page + cursor" as a broken module.
      expect(page.items.length === 0 && page.next !== undefined).toBe(false);
    });
  });
});
