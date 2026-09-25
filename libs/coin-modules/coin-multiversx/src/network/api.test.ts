import network from "@ledgerhq/live-network";
import { MAX_PAGINATION_RESULT_WINDOW, MAX_PAGINATION_SIZE } from "../constants";
import type { MultiversXApiTransaction } from "../types";
import { MultiversXNetworkApi } from "./api";

jest.mock("@ledgerhq/live-network", () => {
  const fn = jest.fn();
  return { __esModule: true, default: fn };
});

const mockedNetwork = network as unknown as jest.Mock;

function makeTx(hash: string, timestamp: number): MultiversXApiTransaction {
  return { txHash: hash, timestamp } as MultiversXApiTransaction;
}

/** Builds `count` synthetic transactions, newest first, one per second. */
function makeTransactions(count: number, startTimestamp = count): MultiversXApiTransaction[] {
  return Array.from({ length: count }, (_, i) => makeTx(`tx-${count - i}`, startTimestamp - i));
}

function parseFromSize(url: string): { from: number; size: number } {
  const from = Number(new URL(url).searchParams.get("from"));
  const size = Number(new URL(url).searchParams.get("size"));
  return { from, size };
}

describe("MultiversXNetworkApi startAt clamping", () => {
  const api = new MultiversXNetworkApi("https://api.example.com", "https://deleg.example.com");

  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  test("getHistory clamps startAt=0 to after=1", async () => {
    // First call gets the count, 0 means no pagination loop
    mockedNetwork.mockResolvedValueOnce({ data: 0 });

    await api.getHistory("erd1testaddress", 0);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/accounts/erd1testaddress/transactions/count?after=1"),
      }),
    );
  });

  test("getHistory uses positive startAt unchanged", async () => {
    mockedNetwork.mockResolvedValueOnce({ data: 0 });

    await api.getHistory("erd1positive", 123);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/accounts/erd1positive/transactions/count?after=123"),
      }),
    );
  });

  test("getESDTTransactionsForAddress clamps startAt=0 to after=1", async () => {
    mockedNetwork.mockResolvedValueOnce({ data: 0 });

    await api.getESDTTransactionsForAddress("erd1tokaddr", "TOKEN-abc", 0);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining(
          "/accounts/erd1tokaddr/transactions/count?token=TOKEN-abc&after=1",
        ),
      }),
    );
  });

  test("getESDTTransactionsForAddress uses positive startAt unchanged", async () => {
    mockedNetwork.mockResolvedValueOnce({ data: 0 });

    await api.getESDTTransactionsForAddress("erd1tokaddr", "TOKEN-abc", 456);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining(
          "/accounts/erd1tokaddr/transactions/count?token=TOKEN-abc&after=456",
        ),
      }),
    );
  });
});

describe("MultiversXNetworkApi pagination past the 10k result-window cap", () => {
  const api = new MultiversXNetworkApi("https://api.example.com", "https://deleg.example.com");

  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  test("getHistory never requests from + size > MAX_PAGINATION_RESULT_WINDOW and returns every transaction", async () => {
    const totalCount = 10050;
    const allTx = makeTransactions(totalCount);

    mockedNetwork.mockImplementation(async ({ url }: { url: string }) => {
      if (url.includes("/transactions/count")) {
        return { data: totalCount };
      }
      const parsed = new URL(url);
      const from = Number(parsed.searchParams.get("from"));
      const size = Number(parsed.searchParams.get("size"));
      const before = parsed.searchParams.get("before");

      // Simulate the API's own hard cap.
      if (from + size > MAX_PAGINATION_RESULT_WINDOW) {
        throw new Error(
          `Result window is too large, from + size must be less than or equal to: [${MAX_PAGINATION_RESULT_WINDOW}] but was [${from + size}]`,
        );
      }

      const pool = before ? allTx.filter(tx => (tx.timestamp ?? 0) < Number(before)) : allTx;
      return { data: pool.slice(from, from + size) };
    });

    const result = await api.getHistory("erd1big", 0);

    // No request ever crossed the API's result-window cap.
    for (const call of mockedNetwork.mock.calls) {
      const url = call[0].url as string;
      if (!url.includes("/transactions?")) continue;
      const { from, size } = parseFromSize(url);
      expect(from + size).toBeLessThanOrEqual(MAX_PAGINATION_RESULT_WINDOW);
    }

    // The full, deduped transaction set is returned — nothing silently dropped.
    expect(result).toHaveLength(totalCount);
    const returnedHashes = new Set(result.map(tx => tx.txHash));
    expect(returnedHashes.size).toBe(totalCount);
    for (const tx of allTx) {
      expect(returnedHashes.has(tx.txHash)).toBe(true);
    }
  });

  test("getHistory shifts the window using a `before` cursor once from hits the cap", async () => {
    const totalCount = MAX_PAGINATION_RESULT_WINDOW + MAX_PAGINATION_SIZE;
    const allTx = makeTransactions(totalCount);

    mockedNetwork.mockImplementation(async ({ url }: { url: string }) => {
      if (url.includes("/transactions/count")) {
        return { data: totalCount };
      }
      const parsed = new URL(url);
      const from = Number(parsed.searchParams.get("from"));
      const size = Number(parsed.searchParams.get("size"));
      const before = parsed.searchParams.get("before");
      const pool = before ? allTx.filter(tx => (tx.timestamp ?? 0) < Number(before)) : allTx;
      return { data: pool.slice(from, from + size) };
    });

    await api.getHistory("erd1big", 0);

    const transactionCalls = mockedNetwork.mock.calls
      .map(call => call[0].url as string)
      .filter(url => url.includes("/transactions?"));

    // First window: no `before` cursor.
    expect(transactionCalls[0]).not.toContain("before=");
    // Once `from` would exceed the cap, a `before` cursor must appear.
    const withBefore = transactionCalls.filter(url => url.includes("before="));
    expect(withBefore.length).toBeGreaterThan(0);
  });

  test("getESDTTransactionsForAddress never requests from + size > MAX_PAGINATION_RESULT_WINDOW and returns every transaction", async () => {
    const totalCount = 10200;
    const allTx = makeTransactions(totalCount);

    mockedNetwork.mockImplementation(async ({ url }: { url: string }) => {
      if (url.includes("/transactions/count")) {
        return { data: totalCount };
      }
      const parsed = new URL(url);
      const from = Number(parsed.searchParams.get("from"));
      const size = Number(parsed.searchParams.get("size"));
      const before = parsed.searchParams.get("before");

      if (from + size > MAX_PAGINATION_RESULT_WINDOW) {
        throw new Error(
          `Result window is too large, from + size must be less than or equal to: [${MAX_PAGINATION_RESULT_WINDOW}] but was [${from + size}]`,
        );
      }

      const pool = before ? allTx.filter(tx => (tx.timestamp ?? 0) < Number(before)) : allTx;
      return { data: pool.slice(from, from + size) };
    });

    const result = await api.getESDTTransactionsForAddress("erd1big", "TOKEN-abc", 0);

    for (const call of mockedNetwork.mock.calls) {
      const url = call[0].url as string;
      if (!url.includes("/transactions?")) continue;
      const { from, size } = parseFromSize(url);
      expect(from + size).toBeLessThanOrEqual(MAX_PAGINATION_RESULT_WINDOW);
    }

    expect(result).toHaveLength(totalCount);
    const returnedHashes = new Set(result.map(tx => tx.txHash));
    expect(returnedHashes.size).toBe(totalCount);
  });

  test("getHistory stops once a short page confirms the end of data, without over-fetching", async () => {
    // Fewer transactions than reported by count (edge case / race between count and
    // list calls): pagination must stop on a short page rather than looping forever.
    const reportedCount = 20;
    const actualTx = makeTransactions(5);

    mockedNetwork.mockImplementation(async ({ url }: { url: string }) => {
      if (url.includes("/transactions/count")) {
        return { data: reportedCount };
      }
      const parsed = new URL(url);
      const from = Number(parsed.searchParams.get("from"));
      const size = Number(parsed.searchParams.get("size"));
      return { data: actualTx.slice(from, from + size) };
    });

    const result = await api.getHistory("erd1short", 0);

    expect(result).toHaveLength(5);
  });
});
