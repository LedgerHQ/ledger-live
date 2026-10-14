import { listOperations, parseAnchor, parseCursor } from "./listOperations";

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

describe("parseAnchor", () => {
  it.each([
    { cursor: undefined, anchor: undefined },
    { cursor: "1720440515512", anchor: undefined },
    { cursor: "1720440515512:1720440000000", anchor: 1720440000000 },
    { cursor: "1720440515512:", anchor: undefined },
    { cursor: "1720440515512:abc", anchor: undefined },
    { cursor: "1720440515512:0", anchor: undefined },
  ])("$cursor → $anchor", ({ cursor, anchor }) => {
    expect(parseAnchor(baseOptions(cursor === undefined ? {} : { cursor }))).toBe(anchor);
  });

  it("leaves parseCursor reading only the `before` part", () => {
    expect(parseCursor(baseOptions({ cursor: "1720440515512:1720440000000" }))).toBe(1720440515512);
  });
});

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const HOUR = 60 * 60 * 1000;

  // Minimal indexer tx: an IN of 1 sompi to ADDRESS. Its block time defaults to `score` hours, so
  // score order and block-time order agree; pass `hours` to model a late-accepted tx (older block
  // time, higher score). The lookback window is LATE_ACCEPTANCE_WINDOW_MS = 2 h.
  function tx(score: number, hours = score) {
    return {
      transaction_id: `tx-${score}`,
      hash: `tx-${score}`,
      block_hash: ["h"],
      block_time: hours * HOUR,
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

  describe("minHeight filter and late-acceptance lookback", () => {
    type Tx = number | [score: number, hours: number];
    const toTx = (t: Tx) => (typeof t === "number" ? tx(t) : tx(t[0], t[1]));

    it.each([
      // Full sync: no filtering, the indexer's cursor passes through.
      {
        name: "full sync, more pages",
        minHeight: 0,
        pages: [{ txs: [50, 40, 30], next: "1" }],
        kept: [50, 40, 30],
        next: "1",
        calls: 1,
      },
      {
        name: "full sync, last page",
        minHeight: 0,
        pages: [{ txs: [50, 40], next: null }],
        kept: [50, 40],
        next: undefined,
        calls: 1,
      },
      // Nothing already-synced on the page yet: keep walking, no anchor in the cursor.
      {
        name: "incremental, whole page new",
        minHeight: 10,
        pages: [{ txs: [50, 40, 30], next: "1" }],
        kept: [50, 40, 30],
        next: "1",
        calls: 1,
      },
      {
        name: "incremental, lowest item exactly at minHeight",
        minHeight: 30,
        pages: [{ txs: [50, 40, 30], next: "1" }],
        kept: [50, 40, 30],
        next: "1",
        calls: 1,
      },
      // Already-synced txs on the page and the page reaches > 2 h below the newest of them: stop.
      {
        name: "incremental, page runs past the lookback window",
        minHeight: 35,
        pages: [{ txs: [50, 40, 30, 20], next: "1" }],
        kept: [50, 40],
        next: undefined,
        calls: 1,
      },
      {
        name: "incremental, an item exactly at minHeight is kept",
        minHeight: 40,
        pages: [{ txs: [50, 40, 30, 10], next: "1" }],
        kept: [50, 40],
        next: undefined,
        calls: 1,
      },
      {
        name: "incremental, late-accepted tx among older ones on the same page",
        minHeight: 35,
        pages: [{ txs: [50, 20, 40, 10], next: "1" }],
        kept: [50, 40],
        next: undefined,
        calls: 1,
      },
      {
        name: "incremental, page entirely below minHeight and past the window",
        minHeight: 100,
        pages: [{ txs: [50, 40], next: "1" }],
        kept: [],
        next: undefined,
        calls: 1,
      },
      // Inside the window with new items: return them, and carry the anchor (30 h) in the cursor.
      {
        name: "incremental, inside the window, returns new items and the anchor",
        minHeight: 35,
        pages: [{ txs: [50, 40, 30], next: "1000" }],
        kept: [50, 40],
        next: `1000:${30 * HOUR}`,
        calls: 1,
      },
      // Inside the window with nothing new: keep reading pages here rather than return an empty page.
      {
        name: "incremental, late-accepted tx on the next page is not lost",
        minHeight: 100,
        pages: [
          { txs: [99, 98], next: "2000" }, // all already synced, anchor 99 h, oldest 98 h: inside the window
          { txs: [[150, 97], 90], next: "3000" }, // 150 was accepted late (block time 97 h); 90 h is past the window
        ],
        kept: [150],
        next: undefined,
        calls: 2,
      },
      {
        name: "empty page, no further pages",
        minHeight: 10,
        pages: [{ txs: [], next: null }],
        kept: [],
        next: undefined,
        calls: 1,
      },
    ])("$name", async ({ minHeight, pages, kept, next, calls }) => {
      for (const page of pages) {
        mockGetTransactions.mockResolvedValueOnce({
          transactions: (page.txs as Tx[]).map(toTx),
          nextPageBefore: page.next,
          nextPageAfter: null,
        });
      }

      const result = await listOperations(ADDRESS, baseOptions({ minHeight }));

      expect(result.items.map(op => op.tx.block.height)).toEqual(kept);
      expect(result.next).toBe(next);
      expect(mockGetTransactions).toHaveBeenCalledTimes(calls);
      // generic-coin-framework's paginateOperations treats "empty page + cursor" as a broken module.
      expect(result.items.length === 0 && result.next !== undefined).toBe(false);
    });

    it("reads the next page from the cursor's `before` part when it walks on", async () => {
      mockGetTransactions
        .mockResolvedValueOnce({
          transactions: [tx(99), tx(98)],
          nextPageBefore: "2000",
          nextPageAfter: null,
        })
        .mockResolvedValueOnce({
          transactions: [tx(90)],
          nextPageBefore: null,
          nextPageAfter: null,
        });

      await listOperations(ADDRESS, baseOptions({ minHeight: 100 }));

      expect(mockGetTransactions).toHaveBeenNthCalledWith(2, ADDRESS, {
        before: 2000,
        limit: undefined,
      });
    });

    it.each([
      { name: "repeats", cursor: "2000" },
      { name: "grows", cursor: "9000" },
      { name: "is malformed", cursor: "abc" },
    ])("stops instead of re-reading when the indexer cursor $name", async ({ cursor }) => {
      // Inside the lookback window with nothing new, so listOperations reads on by itself.
      mockGetTransactions
        .mockResolvedValueOnce({
          transactions: [tx(99), tx(98)],
          nextPageBefore: "2000",
          nextPageAfter: null,
        })
        .mockResolvedValueOnce({
          transactions: [tx(97.5)],
          nextPageBefore: cursor,
          nextPageAfter: null,
        });

      const result = await listOperations(ADDRESS, baseOptions({ minHeight: 100 }));

      expect(result).toEqual({ items: [], next: undefined });
      expect(mockGetTransactions).toHaveBeenCalledTimes(2);
    });

    // A page that has new items is returned at once — its cursor must still be checked, or the next
    // call would restart from the newest page or repeat this one and return the same items twice.
    it.each([
      { name: "repeats the requested one", cursor: "5000" },
      { name: "grows", cursor: "9000" },
      { name: "is malformed", cursor: "abc" },
      { name: "is not positive", cursor: "0" },
    ])("returns new items without a cursor when the indexer's cursor $name", async ({ cursor }) => {
      mockGetTransactions.mockResolvedValueOnce({
        transactions: [tx(150), tx(140)],
        nextPageBefore: cursor,
        nextPageAfter: null,
      });

      const result = await listOperations(ADDRESS, baseOptions({ minHeight: 100, cursor: "5000" }));

      expect(result.items.map(op => op.tx.block.height)).toEqual([150, 140]);
      expect(result.next).toBeUndefined();
    });

    it.each(["abc", "0", "-5"])(
      "ends a full sync instead of following an unusable cursor (%s)",
      async cursor => {
        mockPage([50, 40], cursor);

        const result = await listOperations(ADDRESS, baseOptions());

        expect(result.items.map(op => op.tx.block.height)).toEqual([50, 40]);
        expect(result.next).toBeUndefined();
      },
    );

    it("keeps the anchor from the cursor across calls", async () => {
      // A previous call saw an already-synced tx at 30 h; this page only reaches 29 h: still inside.
      mockGetTransactions.mockResolvedValueOnce({
        transactions: [tx(60, 29.5), tx(20, 29)],
        nextPageBefore: "4000",
        nextPageAfter: null,
      });

      const result = await listOperations(
        ADDRESS,
        baseOptions({ minHeight: 35, cursor: `5000:${30 * HOUR}` }),
      );

      expect(mockGetTransactions).toHaveBeenCalledWith(ADDRESS, { before: 5000, limit: undefined });
      expect(result.items.map(op => op.tx.block.height)).toEqual([60]);
      expect(result.next).toBe(`4000:${30 * HOUR}`);
    });
  });
});
