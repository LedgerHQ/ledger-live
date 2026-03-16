import { VALID_ADDRESS, VALID_ADDRESS_2 } from "../../test/fixtures";
import type { WalletProxyTransaction } from "../../types";
import { listOperations, parseTransaction } from "./listOperations";

jest.mock("@ledgerhq/concordium-core", () => ({
  decodeMemoFromCbor: jest.fn(),
}));

jest.mock("../../network/proxyClient", () => ({
  getTransactions: jest.fn(),
}));

const { getTransactions: getTransactionsMock } = jest.requireMock("../../network/proxyClient");

describe("parseTransaction", () => {
  const baseTx: Omit<WalletProxyTransaction, "details"> = {
    id: 42,
    blockTime: 1700000000,
    blockHash: "aabb",
    blockHeight: 1000,
    transactionHash: "cc".repeat(32),
    cost: 500,
    origin: { type: "self" },
    total: -1000500,
  };

  it("should parse an outgoing transfer", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
      },
    };

    const result = parseTransaction(tx, VALID_ADDRESS);

    expect(result).toMatchObject({
      hash: "cc".repeat(32),
      type: "OUT",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: "1000000",
      fee: "500",
      failed: false,
      id: 42,
    });
    expect(result!.value).toBe(String(BigInt(1000000) + BigInt(500)));
  });

  it("should parse an incoming transfer", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: VALID_ADDRESS,
        transferAmount: "2000000",
      },
    };

    const result = parseTransaction(tx, VALID_ADDRESS);

    expect(result).toMatchObject({
      type: "IN",
      amount: "2000000",
      value: "2000000",
    });
  });

  it("should return null for non-transfer transactions", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: { type: "bakingReward", outcome: "success" },
    };

    expect(parseTransaction(tx, VALID_ADDRESS)).toBeNull();
  });

  it("should return null when address is neither sender nor recipient", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS_2,
        transferDestination: "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh",
        transferAmount: "1000",
      },
    };

    expect(parseTransaction(tx, VALID_ADDRESS)).toBeNull();
  });

  it("should mark failed transactions", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transfer",
        outcome: "reject",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "500000",
      },
    };

    const result = parseTransaction(tx, VALID_ADDRESS);
    expect(result!.failed).toBe(true);
  });

  it("should compute value as fee only for failed outgoing transfers", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      cost: 300,
      details: {
        type: "transfer",
        outcome: "reject",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "500000",
      },
    };

    const result = parseTransaction(tx, VALID_ADDRESS);
    expect(result!.value).toBe("300");
    expect(result!.amount).toBe("500000");
    expect(result!.fee).toBe("300");
  });

  it("should compute value as 0 for failed incoming transfers", () => {
    const tx: WalletProxyTransaction = {
      ...baseTx,
      cost: 300,
      details: {
        type: "transfer",
        outcome: "reject",
        transferSource: VALID_ADDRESS_2,
        transferDestination: VALID_ADDRESS,
        transferAmount: "500000",
      },
    };

    const result = parseTransaction(tx, VALID_ADDRESS);
    expect(result!.value).toBe("0");
  });

  it("should return memo as undefined when CBOR decoding fails", () => {
    const { decodeMemoFromCbor } = jest.requireMock("@ledgerhq/concordium-core");
    decodeMemoFromCbor.mockImplementation(() => {
      throw new Error("invalid CBOR");
    });

    const tx: WalletProxyTransaction = {
      ...baseTx,
      details: {
        type: "transferWithMemo",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000000",
        memo: "deadbeef",
      },
    };

    const result = parseTransaction(tx, VALID_ADDRESS);

    expect(result).not.toBeNull();
    expect(result!.memo).toBeUndefined();
  });
});

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch transactions and return RawOperations", async () => {
    const blockTime = Date.now() / 1000;
    getTransactionsMock.mockResolvedValue({
      transactions: [
        {
          id: 42,
          blockTime,
          blockHash: "aabb",
          blockHeight: 1000,
          transactionHash: "cc".repeat(32),
          cost: 500,
          origin: { type: "self" },
          details: {
            type: "transfer",
            outcome: "success",
            transferSource: VALID_ADDRESS,
            transferDestination: VALID_ADDRESS_2,
            transferAmount: "1000000",
          },
          total: -1000500,
        },
      ],
      count: 1,
      limit: 100,
      order: "descending",
    });

    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    expect(getTransactionsMock).toHaveBeenCalledWith("concordium_testnet", VALID_ADDRESS, {
      limit: 100,
      order: "d",
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      hash: "cc".repeat(32),
      type: "OUT",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: "1000000",
      fee: "500",
    });
    expect(result.items[0].value).toBe(String(BigInt(1000000) + BigInt(500)));
    expect(result.next).toBeUndefined();
  });

  it("should pass blockHeightFrom when minHeight > 0", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [],
      count: 0,
      limit: 100,
      order: "descending",
    });

    await listOperations(VALID_ADDRESS, { minHeight: 500 }, "concordium_testnet");

    expect(getTransactionsMock).toHaveBeenCalledWith("concordium_testnet", VALID_ADDRESS, {
      limit: 100,
      order: "d",
      blockHeightFrom: 500,
    });
  });

  it("should pass cursor as from param", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [],
      count: 0,
      limit: 100,
      order: "descending",
    });

    await listOperations(VALID_ADDRESS, { minHeight: 0, cursor: "42" }, "concordium_testnet");

    expect(getTransactionsMock).toHaveBeenCalledWith("concordium_testnet", VALID_ADDRESS, {
      limit: 100,
      order: "d",
      from: "42",
    });
  });

  it("should return next cursor when more pages exist", async () => {
    const txs = Array.from({ length: 100 }, (_, i) => ({
      id: 200 - i,
      blockTime: Date.now() / 1000,
      blockHash: "aabb",
      blockHeight: 1000,
      transactionHash: `${"cc".repeat(31)}${String(i).padStart(2, "0")}`,
      cost: 100,
      origin: { type: "self" as const },
      details: {
        type: "transfer",
        outcome: "success",
        transferSource: VALID_ADDRESS,
        transferDestination: VALID_ADDRESS_2,
        transferAmount: "1000",
      },
      total: -1100,
    }));

    getTransactionsMock.mockResolvedValue({
      transactions: txs,
      count: 100,
      limit: 100,
      order: "descending",
    });

    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    expect(result.next).toBe("101");
  });

  it("should filter non-transfer transactions", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [
        {
          id: 10,
          blockTime: Date.now() / 1000,
          blockHash: "aabb",
          blockHeight: 1000,
          transactionHash: "dd".repeat(32),
          origin: { type: "reward" },
          details: { type: "bakingReward", outcome: "success" },
          total: 5000,
        },
      ],
      count: 1,
      limit: 100,
      order: "descending",
    });

    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    expect(result.items).toHaveLength(0);
  });

  it("should return empty array on error", async () => {
    getTransactionsMock.mockRejectedValue(new Error("network error"));

    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    expect(result).toEqual({ items: [], next: undefined });
  });
});
