// Exercises the account read/query helpers' branch + pagination logic. The @dfinity candid codec is
// upstream-tested, so getAgent (the query transport) and the candid decode are mocked and we assert
// the function's own handling of replied/non-replied, absent values, and pagination.
const mockQuery = jest.fn();
const mockDecode = jest.fn();

jest.mock("../network/agent", () => ({
  getAgent: jest.fn(async () => ({ query: mockQuery })),
}));
jest.mock("../network/candid", () => ({
  getCanisterIdlFunc: jest.fn(() => ({ argTypes: [], retTypes: [] })),
  encodeCanisterIdlFunc: jest.fn(() => new ArrayBuffer(0)),
  decodeCanisterIdlFunc: (...args: unknown[]) => mockDecode(...args),
  indexIdlFactory: {},
  ledgerIdlFactory: {},
  governanceIdlFactory: {},
}));

import { fetchBalance, fetchBlockHeight, fetchTxns } from "./api";

const replied = () => ({ status: "replied", reply: { arg: new ArrayBuffer(0) } });

afterEach(() => jest.clearAllMocks());

describe("fetchBalance", () => {
  it("returns the balance when the query replies", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([500n]); // fromNullable([500n]) => 500n
    expect((await fetchBalance("addr")).toString()).toBe("500");
  });

  it("returns 0 when the query is not replied", async () => {
    mockQuery.mockResolvedValue({ status: "rejected" });
    expect((await fetchBalance("addr")).toString()).toBe("0");
  });

  it("returns 0 when the balance is absent", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([]); // fromNullable([]) => undefined
    expect((await fetchBalance("addr")).toString()).toBe("0");
  });
});

describe("fetchBlockHeight", () => {
  it("returns the ledger chain length", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([{ chain_length: 987n }]);
    expect((await fetchBlockHeight()).toString()).toBe("987");
  });

  it("throws when the query is not replied", async () => {
    mockQuery.mockResolvedValue({ status: "rejected" });
    await expect(fetchBlockHeight()).rejects.toThrow(/Query failed/);
  });
});

describe("fetchTxns", () => {
  it("short-circuits without querying when start <= stop", async () => {
    expect(await fetchTxns("addr", 5n, 10n)).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns an empty list when the account has no transactions", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([{ Ok: { transactions: [] } }]);
    expect(await fetchTxns("addr", 10n, 0n)).toEqual([]);
  });

  it("paginates across pages until an empty page", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode
      .mockReturnValueOnce([{ Ok: { transactions: [{ id: 5n }, { id: 4n }] } }])
      .mockReturnValueOnce([{ Ok: { transactions: [] } }]);
    expect(await fetchTxns("addr", 10n, 0n)).toEqual([{ id: 5n }, { id: 4n }]);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("throws when the transactions query is not replied", async () => {
    mockQuery.mockResolvedValue({ status: "rejected" });
    await expect(fetchTxns("addr", 10n, 0n)).rejects.toThrow(/Query failed/);
  });
});
