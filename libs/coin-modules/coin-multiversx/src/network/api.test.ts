import network from "@ledgerhq/live-network";
import { MAX_PAGINATION_RESULT_WINDOW } from "../constants";
import type { MultiversXApiTransaction } from "../types";
import { MultiversXNetworkApi } from "./api";

jest.mock("@ledgerhq/live-network", () => {
  const fn = jest.fn();
  return { __esModule: true, default: fn };
});

const mockedNetwork = network as unknown as jest.Mock;

function makeTransactions(count: number, transactionsPerTimestamp = 1): MultiversXApiTransaction[] {
  return Array.from(
    { length: count },
    (_, i) =>
      ({
        txHash: `tx-${i}`,
        timestamp: count - Math.floor(i / transactionsPerTimestamp),
      }) as MultiversXApiTransaction,
  );
}

function mockApi(transactions: MultiversXApiTransaction[], count = transactions.length) {
  mockedNetwork.mockImplementation(async ({ url }: { url: string }) => {
    if (url.includes("/transactions/count")) return { data: count };
    const params = new URL(url).searchParams;
    const from = Number(params.get("from"));
    const size = Number(params.get("size"));
    const before = params.get("before");
    if (from + size > MAX_PAGINATION_RESULT_WINDOW) {
      throw new Error("Result window is too large");
    }
    const filtered = before
      ? transactions.filter(tx => (tx.timestamp ?? 0) < Number(before))
      : transactions;
    return { data: filtered.slice(from, from + size) };
  });
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

describe("MultiversXNetworkApi pagination past the result window", () => {
  const api = new MultiversXNetworkApi("https://api.example.com", "https://deleg.example.com");

  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  test("getHistory returns every transaction beyond the window", async () => {
    const transactions = makeTransactions(MAX_PAGINATION_RESULT_WINDOW + 50);
    mockApi(transactions);

    const result = await api.getHistory("erd1big", 0);

    expect(result.map(tx => tx.txHash)).toEqual(transactions.map(tx => tx.txHash));
  });

  test("getHistory keeps transactions sharing a timestamp across the window boundary", async () => {
    const transactions = makeTransactions(MAX_PAGINATION_RESULT_WINDOW + 50, 7);
    mockApi(transactions);

    const result = await api.getHistory("erd1big", 0);

    expect(result.map(tx => tx.txHash)).toEqual(transactions.map(tx => tx.txHash));
  });

  test("getESDTTransactionsForAddress returns every transaction beyond the window", async () => {
    const transactions = makeTransactions(MAX_PAGINATION_RESULT_WINDOW + 50);
    mockApi(transactions);

    const result = await api.getESDTTransactionsForAddress("erd1big", "TOKEN-abc", 0);

    expect(result.map(tx => tx.txHash)).toEqual(transactions.map(tx => tx.txHash));
  });

  test("getHistory stops on a short page when count overstates the history", async () => {
    const transactions = makeTransactions(5);
    mockApi(transactions, 20);

    const result = await api.getHistory("erd1short", 0);

    expect(result.map(tx => tx.txHash)).toEqual(transactions.map(tx => tx.txHash));
  });

  test("getHistory throws when a full window shares one timestamp", async () => {
    mockApi(makeTransactions(MAX_PAGINATION_RESULT_WINDOW + 50, MAX_PAGINATION_RESULT_WINDOW + 50));

    await expect(api.getHistory("erd1stuck", 0)).rejects.toThrow("result window");
  });
});
