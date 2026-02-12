import BigNumber from "bignumber.js";
import { getAgent } from "../dfinity/agent";
import {
  getCanisterIdlFunc,
  encodeCanisterIdlFunc,
  decodeCanisterIdlFunc,
  fromNullable,
  Principal,
} from "../dfinity/candid";
import { fetchBlockHeight, broadcastTxn, fetchBalance, fetchTxns } from "./api";

jest.mock("../dfinity/agent");
jest.mock("../dfinity/candid", () => ({
  ledgerIdlFactory: jest.fn(),
  indexIdlFactory: jest.fn(),
  getCanisterIdlFunc: jest.fn().mockReturnValue({ argTypes: [], retTypes: [] }),
  encodeCanisterIdlFunc: jest.fn().mockReturnValue(new Uint8Array()),
  decodeCanisterIdlFunc: jest.fn(),
  fromNullable: jest.fn(),
  Principal: { fromText: jest.fn().mockReturnValue("mock-principal") },
}));

const mockGetAgent = jest.mocked(getAgent);
const mockDecodeCanisterIdlFunc = jest.mocked(decodeCanisterIdlFunc);
const mockFromNullable = jest.mocked(fromNullable);

describe("fetchBlockHeight", () => {
  it("should return block height from the ledger canister", async () => {
    const mockAgent = {
      query: jest.fn().mockResolvedValue({
        status: "replied",
        reply: { arg: new Uint8Array() },
      }),
    };
    mockGetAgent.mockResolvedValue(mockAgent as any);
    mockDecodeCanisterIdlFunc.mockReturnValue([{ chain_length: BigInt(5000) }] as any);
    mockFromNullable.mockReturnValue({ chain_length: BigInt(5000) } as any);

    const result = await fetchBlockHeight();
    expect(result).toEqual(new BigNumber(5000));
  });

  it("should throw when query status is not replied", async () => {
    const mockAgent = {
      query: jest.fn().mockResolvedValue({ status: "rejected" }),
    };
    mockGetAgent.mockResolvedValue(mockAgent as any);

    await expect(fetchBlockHeight()).rejects.toThrow();
  });
});

describe("broadcastTxn", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should POST the payload and return the response buffer on 200", async () => {
    const mockBuffer = new ArrayBuffer(8);
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      arrayBuffer: jest.fn().mockResolvedValue(mockBuffer),
    }) as any;

    const result = await broadcastTxn(Buffer.from("test"), "canister-id", "call");
    expect(result).toBe(mockBuffer);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("canister-id/call"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should throw on non-200 response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      text: jest.fn().mockResolvedValue("Server error"),
    }) as any;

    await expect(broadcastTxn(Buffer.from("test"), "canister-id", "call")).rejects.toThrow(
      "Failed to broadcast",
    );
  });
});

describe("fetchBalance", () => {
  it("should return balance for a valid address", async () => {
    const mockAgent = {
      query: jest.fn().mockResolvedValue({
        status: "replied",
        reply: { arg: new Uint8Array() },
      }),
    };
    mockGetAgent.mockResolvedValue(mockAgent as any);
    mockDecodeCanisterIdlFunc.mockReturnValue([BigInt(200000)] as any);
    mockFromNullable.mockReturnValue(BigInt(200000) as any);

    const result = await fetchBalance("test-address");
    expect(result).toEqual(new BigNumber(200000));
  });

  it("should return 0 when query fails", async () => {
    const mockAgent = {
      query: jest.fn().mockResolvedValue({ status: "rejected" }),
    };
    mockGetAgent.mockResolvedValue(mockAgent as any);

    const result = await fetchBalance("test-address");
    expect(result).toEqual(new BigNumber(0));
  });

  it("should return 0 when balance is not decodable", async () => {
    const mockAgent = {
      query: jest.fn().mockResolvedValue({
        status: "replied",
        reply: { arg: new Uint8Array() },
      }),
    };
    mockGetAgent.mockResolvedValue(mockAgent as any);
    mockDecodeCanisterIdlFunc.mockReturnValue([] as any);
    mockFromNullable.mockReturnValue(undefined as any);

    const result = await fetchBalance("test-address");
    expect(result).toEqual(new BigNumber(0));
  });
});

describe("fetchTxns", () => {
  it("should return empty array when startBlockHeight <= stopBlockHeight", async () => {
    const result = await fetchTxns("addr", BigInt(5), BigInt(10));
    expect(result).toEqual([]);
  });

  it("should fetch transactions and recurse until exhausted", async () => {
    const mockAgent = {
      query: jest.fn().mockResolvedValue({
        status: "replied",
        reply: { arg: new Uint8Array() },
      }),
    };
    mockGetAgent.mockResolvedValue(mockAgent as any);

    // First call returns one transaction, recursive call returns empty
    mockDecodeCanisterIdlFunc.mockReturnValueOnce([
      {
        Ok: {
          transactions: [{ id: BigInt(5), transaction: {} }],
          balance: BigInt(100000),
          oldest_tx_id: [BigInt(1)],
        },
      },
    ] as any);
    mockFromNullable.mockReturnValueOnce({
      Ok: {
        transactions: [{ id: BigInt(5), transaction: {} }],
        balance: BigInt(100000),
        oldest_tx_id: [BigInt(1)],
      },
    } as any);

    // Recursive call - startBlockHeight(5) <= stopBlockHeight(default 0) is false
    // so it calls again, we need another mock
    mockDecodeCanisterIdlFunc.mockReturnValueOnce([
      {
        Ok: {
          transactions: [],
          balance: BigInt(100000),
          oldest_tx_id: [],
        },
      },
    ] as any);
    mockFromNullable.mockReturnValueOnce({
      Ok: {
        transactions: [],
        balance: BigInt(100000),
        oldest_tx_id: [],
      },
    } as any);

    const result = await fetchTxns("addr", BigInt(100));
    expect(result).toHaveLength(1);
  });
});
