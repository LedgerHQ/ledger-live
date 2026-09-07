import { VALID_ADDRESS, VALID_ADDRESS_2, createFixtureConfig } from "../../test/fixtures";
import type { WalletProxyTransaction } from "../../types";
import { listOperations, parseTransaction } from "./listOperations";

const config = createFixtureConfig();

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

describe("parseTransaction, PLT", () => {
  // Shaped after a real testnet tokenUpdate: a 6-decimal token, and a cost the
  // proxy reports only to the sender.
  const outgoingTx: WalletProxyTransaction = {
    id: 2995554,
    blockTime: 1761895039.005,
    blockHash: "8372",
    blockHeight: 34907771,
    transactionHash: "4e41".repeat(16),
    cost: 595400,
    origin: { type: "self" },
    total: -595400,
    details: {
      type: "tokenUpdate",
      outcome: "success",
      transferSource: VALID_ADDRESS,
      transferDestination: VALID_ADDRESS_2,
      tokenId: "trUSDT",
      tokenTransferAmount: { value: "3000000", decimals: 6 },
    },
  };

  // An incoming transfer omits `cost` entirely rather than reporting zero.
  const incomingTx: WalletProxyTransaction = {
    id: 2994831,
    blockTime: 1761748654.85,
    blockHash: "da2e",
    blockHeight: 34834600,
    transactionHash: "ebcf".repeat(16),
    origin: { type: "account", address: VALID_ADDRESS_2 },
    total: 0,
    details: {
      type: "tokenUpdate",
      outcome: "success",
      transferSource: VALID_ADDRESS_2,
      transferDestination: VALID_ADDRESS,
      tokenId: "trUSDT",
      tokenTransferAmount: { value: "20000000", decimals: 6 },
    },
  };

  beforeEach(() => {
    const { decodeMemoFromCbor } = jest.requireMock("@ledgerhq/concordium-core");
    decodeMemoFromCbor.mockReset();
    decodeMemoFromCbor.mockReturnValue("decoded memo");
  });

  it("parses an outgoing PLT transfer, carrying the token and its denomination", () => {
    expect(parseTransaction(outgoingTx, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: "3000000",
      fee: "595400",
      tokenId: "trUSDT",
      decimals: 6,
      failed: false,
    });
  });

  it("values an outgoing PLT transfer at the token amount, never the amount plus the fee", () => {
    expect(parseTransaction(outgoingTx, VALID_ADDRESS)!.value).toBe("3000000");
  });

  it("parses an incoming PLT transfer with no fee, since the recipient paid none", () => {
    expect(parseTransaction(incomingTx, VALID_ADDRESS)).toMatchObject({
      type: "IN",
      value: "20000000",
      fee: "0",
      tokenId: "trUSDT",
    });
  });

  it("ignores a cost reported on a row the account did not pay for", () => {
    // Reading it would raise a FEES operation debiting the recipient's CCD, and
    // an operation id embeds its type, so the correction could not replace it.
    const withCost = { ...incomingTx, cost: 595400 } as WalletProxyTransaction;

    expect(parseTransaction(withCost, VALID_ADDRESS)!.fee).toBe("0");
  });

  it("decodes a PLT memo, which is CBOR exactly as a CCD memo is", () => {
    const tx = { ...outgoingTx, details: { ...outgoingTx.details, memo: "78ab31" } };

    expect(parseTransaction(tx, VALID_ADDRESS)!.memo).toBe("decoded memo");
  });

  it("returns null when the address is neither source nor destination", () => {
    expect(parseTransaction(outgoingTx, "someone-else")).toBeNull();
  });

  const nonTransfer: WalletProxyTransaction = {
    ...outgoingTx,
    details: { type: "tokenUpdate", outcome: "success", description: "Token update" },
  };

  it("charges the payer for a tokenUpdate that is not a transfer, rather than losing it", () => {
    // A mint, burn, pause or batch: nothing token-side is readable, but the CCD
    // left the account and would otherwise show as an unexplained debit.
    expect(parseTransaction(nonTransfer, VALID_ADDRESS)).toMatchObject({
      type: "OUT",
      value: "595400",
      fee: "595400",
      failed: false,
    });
    expect(parseTransaction(nonTransfer, VALID_ADDRESS)).not.toHaveProperty("tokenId");
  });

  it("returns null for a non-transfer tokenUpdate the account did not pay for", () => {
    const paidByAnother = { ...nonTransfer, origin: { type: "account" } } as WalletProxyTransaction;

    expect(parseTransaction(paidByAnother, VALID_ADDRESS)).toBeNull();
  });

  it("does not read an absent transfer amount as zero", () => {
    const { tokenTransferAmount: _dropped, ...detailsWithoutAmount } = outgoingTx.details;
    const tx: WalletProxyTransaction = { ...outgoingTx, details: detailsWithoutAmount };

    expect(parseTransaction(tx, VALID_ADDRESS)).toMatchObject({ amount: "0", value: "595400" });
  });

  it("refuses a denomination that is not a whole non-negative count of decimals", () => {
    const withBadDecimals = {
      ...outgoingTx,
      details: {
        ...outgoingTx.details,
        tokenTransferAmount: { value: "3000000", decimals: -1 },
      },
    } as WalletProxyTransaction;

    expect(parseTransaction(withBadDecimals, VALID_ADDRESS)).not.toHaveProperty("decimals");
  });

  describe("rejected", () => {
    const rejectedTx: WalletProxyTransaction = {
      ...outgoingTx,
      details: {
        type: "tokenUpdate",
        outcome: "reject",
        rejectReason: "Token update transaction failed",
        rawRejectReason: {
          tag: "TokenUpdateTransactionFailed",
          contents: { tokenId: "trUSDT", type: "operationNotPermitted" },
        },
      },
    };

    it("keeps the operation on its token, worth nothing, when the reason names one", () => {
      expect(parseTransaction(rejectedTx, VALID_ADDRESS)).toMatchObject({
        type: "OUT",
        tokenId: "trUSDT",
        value: "0",
        fee: "595400",
        failed: true,
      });
    });

    it("reads the token id NonExistentTokenId names directly", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        details: {
          ...rejectedTx.details,
          rawRejectReason: { tag: "NonExistentTokenId", contents: "trUSDT" },
        },
      };

      expect(parseTransaction(tx, VALID_ADDRESS)!.tokenId).toBe("trUSDT");
    });

    it("degrades to a plain CCD cost when the reason names no token", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        details: {
          ...rejectedTx.details,
          rawRejectReason: { tag: "InvalidNonce" },
        },
      };

      const result = parseTransaction(tx, VALID_ADDRESS);

      expect(result!.tokenId).toBeUndefined();
      expect(result!.value).toBe("595400");
    });

    it("reports nothing to an account that did not pay the fee", () => {
      const tx: WalletProxyTransaction = {
        ...rejectedTx,
        origin: { type: "account", address: VALID_ADDRESS_2 },
      };

      expect(parseTransaction(tx, VALID_ADDRESS)).toBeNull();
    });
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

    const result = await listOperations(
      config,
      VALID_ADDRESS,
      { minHeight: 0 },
      "concordium_testnet",
    );

    expect(getTransactionsMock).toHaveBeenCalledWith(config, "concordium_testnet", VALID_ADDRESS, {
      limit: 100,
      order: "d",
      includeRawRejectReason: true,
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

  it("should always request the raw reject reason", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [],
      count: 0,
      limit: 100,
      order: "descending",
    });

    await listOperations(config, VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    // The proxy tests the parameter for presence, so `false` would enable it.
    const [, , , params] = getTransactionsMock.mock.calls[0];
    expect(params.includeRawRejectReason).toBe(true);
  });

  it("should pass blockHeightFrom when minHeight > 0", async () => {
    getTransactionsMock.mockResolvedValue({
      transactions: [],
      count: 0,
      limit: 100,
      order: "descending",
    });

    await listOperations(config, VALID_ADDRESS, { minHeight: 500 }, "concordium_testnet");

    expect(getTransactionsMock).toHaveBeenCalledWith(config, "concordium_testnet", VALID_ADDRESS, {
      limit: 100,
      order: "d",
      includeRawRejectReason: true,
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

    await listOperations(
      config,
      VALID_ADDRESS,
      { minHeight: 0, cursor: "42" },
      "concordium_testnet",
    );

    expect(getTransactionsMock).toHaveBeenCalledWith(config, "concordium_testnet", VALID_ADDRESS, {
      limit: 100,
      order: "d",
      includeRawRejectReason: true,
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

    const result = await listOperations(
      config,
      VALID_ADDRESS,
      { minHeight: 0 },
      "concordium_testnet",
    );

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

    const result = await listOperations(
      config,
      VALID_ADDRESS,
      { minHeight: 0 },
      "concordium_testnet",
    );

    expect(result.items).toHaveLength(0);
  });

  it("should return empty array on error", async () => {
    getTransactionsMock.mockRejectedValue(new Error("network error"));

    const result = await listOperations(
      config,
      VALID_ADDRESS,
      { minHeight: 0 },
      "concordium_testnet",
    );

    expect(result).toEqual({ items: [], next: undefined });
  });
});
