// Exercises the account read/query helpers' branch + pagination logic. The candid codec is
// upstream-tested, so getAgent (the query transport) and the candid decode are mocked and we assert
// the function's own handling of replied/non-replied, absent values, and pagination.
const mockQuery = jest.fn();
const mockDecode = jest.fn();

jest.mock("./agent", () => ({
  getAgent: jest.fn(async () => ({ query: mockQuery })),
}));
jest.mock("./candid", () => ({
  getCanisterIdlFunc: jest.fn(() => ({ argTypes: [], retTypes: [] })),
  encodeCanisterIdlFunc: jest.fn(() => new ArrayBuffer(0)),
  decodeCanisterIdlFunc: (...args: unknown[]) => mockDecode(...args),
  indexIdlFactory: {},
  ledgerIdlFactory: {},
  governanceIdlFactory: {},
  archiveEncodedBlocksFunc: {},
  fromOpt: jest.requireActual("./candid").fromOpt,
}));

import { Principal } from "@icp-sdk/core/principal";
import {
  fetchBalance,
  fetchBlockHeight,
  fetchEncodedBlock,
  fetchTxns,
  fetchTxnsPage,
  queryBalance,
} from "./api";

const replied = () => ({ status: "replied", reply: { arg: new ArrayBuffer(0) } });

afterEach(() => jest.clearAllMocks());

describe("fetchBalance", () => {
  it("returns the balance when the query replies", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([500n]);
    expect((await fetchBalance("addr")).toString()).toBe("500");
  });

  it("returns 0 when the query is not replied", async () => {
    mockQuery.mockResolvedValue({ status: "rejected" });
    expect((await fetchBalance("addr")).toString()).toBe("0");
  });

  it("returns 0 when the balance is absent", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([]);
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

describe("queryBalance", () => {
  it("returns the balance when the query replies", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([500n]);
    expect(await queryBalance("addr")).toBe(500n);
  });

  it("returns undefined when the query is not replied", async () => {
    mockQuery.mockResolvedValue({ status: "rejected" });
    expect(await queryBalance("addr")).toBeUndefined();
  });
});

const queriedStart = () => {
  const { encodeCanisterIdlFunc } = jest.requireMock("./candid");
  return encodeCanisterIdlFunc.mock.calls[0][1][0].start;
};

describe("fetchTxnsPage", () => {
  it("queries from the newest transaction without a start", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([{ Ok: { transactions: [{ id: 5n }], oldest_tx_id: [1n] } }]);

    expect(await fetchTxnsPage("addr", undefined)).toEqual({
      transactions: [{ id: 5n }],
      oldestTxId: 1n,
    });
    expect(queriedStart()).toEqual([]);
  });

  it("passes the start through and reports no oldest id for an empty account", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([{ Ok: { transactions: [], oldest_tx_id: [] } }]);

    expect(await fetchTxnsPage("addr", 7n, 10)).toEqual({
      transactions: [],
      oldestTxId: undefined,
    });
    expect(queriedStart()).toEqual([7n]);
  });

  it("throws the index's refusal", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([{ Err: { message: "bad account" } }]);

    await expect(fetchTxnsPage("addr", undefined)).rejects.toThrow(/bad account/);
  });
});

describe("fetchEncodedBlock", () => {
  const ARCHIVE = Principal.fromText("q3fc5-haaaa-aaaaa-aaahq-cai");
  const block = new Uint8Array([1, 2, 3]);

  it("returns a block the ledger still holds", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([{ blocks: [block], archived_blocks: [] }]);

    expect(await fetchEncodedBlock(9n)).toBe(block);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("follows the archive callback for an older block", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode
      .mockReturnValueOnce([
        {
          blocks: [],
          archived_blocks: [
            { start: 0n, length: 5n, callback: [Principal.anonymous(), "unused"] },
            { start: 5n, length: 5n, callback: [ARCHIVE, "get_encoded_blocks"] },
          ],
        },
      ])
      .mockReturnValueOnce([{ Ok: [block] }]);

    expect(await fetchEncodedBlock(7n)).toBe(block);
    expect(mockQuery).toHaveBeenLastCalledWith(
      ARCHIVE,
      expect.objectContaining({
        methodName: "get_encoded_blocks",
      }),
    );
  });

  it("returns undefined above the chain tip", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode.mockReturnValue([{ blocks: [], archived_blocks: [] }]);

    expect(await fetchEncodedBlock(99n)).toBeUndefined();
  });

  it("throws when the archive refuses", async () => {
    mockQuery.mockResolvedValue(replied());
    mockDecode
      .mockReturnValueOnce([
        { blocks: [], archived_blocks: [{ start: 0n, length: 9n, callback: [ARCHIVE, "m"] }] },
      ])
      .mockReturnValueOnce([{ Err: { Other: {} } }]);

    await expect(fetchEncodedBlock(3n)).rejects.toThrow(/Archive refused/);
  });
});
