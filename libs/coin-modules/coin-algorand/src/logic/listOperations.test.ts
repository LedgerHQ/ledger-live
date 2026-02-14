import { BigNumber } from "bignumber.js";
import * as network from "../network";
import { AlgoTransactionType } from "../network";
import { listOperations } from "./listOperations";

jest.mock("../network");

const mockGetAccountTransactions = network.getAccountTransactions as jest.MockedFunction<
  typeof network.getAccountTransactions
>;

describe("listOperations", () => {
  const address = "ALGO_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when no transactions", async () => {
    mockGetAccountTransactions.mockResolvedValue({ transactions: [], nextToken: undefined });

    const [operations, token] = await listOperations(address, { order: "desc" });

    expect(operations).toEqual([]);
    expect(token).toBe("");
  });

  it("should convert payment transaction to OUT operation for sender", async () => {
    const tx = {
      id: "TX_123",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      fee: new BigNumber("1000"),
      round: 1000000,
      timestamp: "1700000000",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        amount: new BigNumber("1000000"),
        recipientAddress: "RECIPIENT_ADDRESS",
        closeToAddress: undefined,
        closeAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations).toHaveLength(1);
    expect(operations[0].type).toBe("OUT");
    expect(operations[0].value).toBe(1000000n);
    expect(operations[0].senders).toEqual([address]);
    expect(operations[0].recipients).toEqual(["RECIPIENT_ADDRESS"]);
    expect(operations[0].asset).toEqual({ type: "native" });
  });

  it("should convert payment transaction to IN operation for recipient", async () => {
    const tx = {
      id: "TX_456",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: "SENDER_ADDRESS",
      fee: new BigNumber("1000"),
      round: 1000001,
      timestamp: "1700000100",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        amount: new BigNumber("500000"),
        recipientAddress: address,
        closeToAddress: undefined,
        closeAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations[0].type).toBe("IN");
    expect(operations[0].value).toBe(500000n);
  });

  it("should convert asset transfer to operation with asa type", async () => {
    const tx = {
      id: "TX_789",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      fee: new BigNumber("1000"),
      round: 1000002,
      timestamp: "1700000200",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("100"),
        assetRecipientAddress: "RECIPIENT_ADDRESS",
        assetId: "12345",
        assetCloseToAddress: undefined,
        assetCloseAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations[0].type).toBe("OUT");
    expect(operations[0].value).toBe(100n);
    expect(operations[0].asset).toEqual({ type: "asa", assetReference: "12345" });
  });

  it("should detect OPT_IN operation", async () => {
    const tx = {
      id: "TX_OPTIN",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      fee: new BigNumber("1000"),
      round: 1000003,
      timestamp: "1700000300",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("0"),
        assetRecipientAddress: address, // Same as sender
        assetId: "67890",
        assetCloseToAddress: undefined,
        assetCloseAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations[0].type).toBe("OPT_IN");
  });

  it("should detect OPT_OUT operation", async () => {
    const tx = {
      id: "TX_OPTOUT",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      fee: new BigNumber("1000"),
      round: 1000004,
      timestamp: "1700000400",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("50"),
        assetRecipientAddress: "RECIPIENT_ADDRESS",
        assetId: "11111",
        assetCloseToAddress: "CLOSE_ADDRESS",
        assetCloseAmount: new BigNumber("100"),
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations[0].type).toBe("OPT_OUT");
  });

  it("should include memo when note is present", async () => {
    const tx = {
      id: "TX_MEMO",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      fee: new BigNumber("1000"),
      round: 1000005,
      timestamp: "1700000500",
      note: "Test memo",
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        amount: new BigNumber("1000000"),
        recipientAddress: "RECIPIENT_ADDRESS",
        closeToAddress: undefined,
        closeAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations[0].memo).toEqual({
      type: "string",
      kind: "note",
      value: "Test memo",
    });
  });

  it("should include rewards in details when present", async () => {
    const tx = {
      id: "TX_REWARDS",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      fee: new BigNumber("1000"),
      round: 1000006,
      timestamp: "1700000600",
      note: undefined,
      senderRewards: new BigNumber("500"),
      recipientRewards: new BigNumber("300"),
      details: {
        amount: new BigNumber("1000000"),
        recipientAddress: "RECIPIENT_ADDRESS",
        closeToAddress: undefined,
        closeAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations[0].details).toEqual({ rewards: 800n });
  });

  it("should sort operations in descending order", async () => {
    const txs = [
      {
        id: "TX_1",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        fee: new BigNumber("1000"),
        round: 1000,
        timestamp: "1700000000",
        note: undefined,
        senderRewards: new BigNumber("0"),
        recipientRewards: new BigNumber("0"),
        details: {
          amount: new BigNumber("100"),
          recipientAddress: "R1",
          closeToAddress: undefined,
          closeAmount: undefined,
        },
      },
      {
        id: "TX_2",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        fee: new BigNumber("1000"),
        round: 3000,
        timestamp: "1700002000",
        note: undefined,
        senderRewards: new BigNumber("0"),
        recipientRewards: new BigNumber("0"),
        details: {
          amount: new BigNumber("200"),
          recipientAddress: "R2",
          closeToAddress: undefined,
          closeAmount: undefined,
        },
      },
      {
        id: "TX_3",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        fee: new BigNumber("1000"),
        round: 2000,
        timestamp: "1700001000",
        note: undefined,
        senderRewards: new BigNumber("0"),
        recipientRewards: new BigNumber("0"),
        details: {
          amount: new BigNumber("300"),
          recipientAddress: "R3",
          closeToAddress: undefined,
          closeAmount: undefined,
        },
      },
    ];

    mockGetAccountTransactions.mockResolvedValue({ transactions: txs, nextToken: "NEXT_TOKEN" });

    const [operations, token] = await listOperations(address, { order: "desc" });

    expect(operations[0].tx.block.height).toBe(3000);
    expect(operations[1].tx.block.height).toBe(2000);
    expect(operations[2].tx.block.height).toBe(1000);
    expect(token).toBe("NEXT_TOKEN");
  });

  it("should sort operations in ascending order", async () => {
    const txs = [
      {
        id: "TX_1",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        fee: new BigNumber("1000"),
        round: 3000,
        timestamp: "1700002000",
        note: undefined,
        senderRewards: new BigNumber("0"),
        recipientRewards: new BigNumber("0"),
        details: {
          amount: new BigNumber("100"),
          recipientAddress: "R1",
          closeToAddress: undefined,
          closeAmount: undefined,
        },
      },
      {
        id: "TX_2",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        fee: new BigNumber("1000"),
        round: 1000,
        timestamp: "1700000000",
        note: undefined,
        senderRewards: new BigNumber("0"),
        recipientRewards: new BigNumber("0"),
        details: {
          amount: new BigNumber("200"),
          recipientAddress: "R2",
          closeToAddress: undefined,
          closeAmount: undefined,
        },
      },
    ];

    mockGetAccountTransactions.mockResolvedValue({ transactions: txs, nextToken: undefined });

    const [operations] = await listOperations(address, { order: "asc" });

    expect(operations[0].tx.block.height).toBe(1000);
    expect(operations[1].tx.block.height).toBe(3000);
  });

  it("should filter out non-payment/transfer transactions", async () => {
    const txs = [
      {
        id: "TX_PAY",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        fee: new BigNumber("1000"),
        round: 1000,
        timestamp: "1700000000",
        note: undefined,
        senderRewards: new BigNumber("0"),
        recipientRewards: new BigNumber("0"),
        details: {
          amount: new BigNumber("100"),
          recipientAddress: "R1",
          closeToAddress: undefined,
          closeAmount: undefined,
        },
      },
      {
        id: "TX_OTHER",
        type: "keyreg" as AlgoTransactionType, // Key registration
        senderAddress: address,
        fee: new BigNumber("1000"),
        round: 2000,
        timestamp: "1700001000",
        note: undefined,
        senderRewards: new BigNumber("0"),
        recipientRewards: new BigNumber("0"),
        details: {},
      },
    ];

    mockGetAccountTransactions.mockResolvedValue({ transactions: txs, nextToken: undefined });

    const [operations] = await listOperations(address, { order: "desc" });

    expect(operations).toHaveLength(1);
    expect(operations[0].id).toBe("TX_PAY");
  });

  it("should forward pagination options to getAccountTransactions", async () => {
    mockGetAccountTransactions.mockResolvedValue({ transactions: [], nextToken: undefined });

    await listOperations(address, {
      order: "asc",
      minHeight: 5000,
      limit: 50,
      token: "PAGE_TOKEN",
    });

    expect(mockGetAccountTransactions).toHaveBeenCalledWith(address, {
      minRound: 5000,
      limit: 50,
      nextToken: "PAGE_TOKEN",
    });
  });

  it("should return next token from paginated response", async () => {
    const tx = {
      id: "TX_PAGE",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      fee: new BigNumber("1000"),
      round: 1000,
      timestamp: "1700000000",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        amount: new BigNumber("100"),
        recipientAddress: "R1",
        closeToAddress: undefined,
        closeAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({
      transactions: [tx],
      nextToken: "CURSOR_ABC",
    });

    const [operations, token] = await listOperations(address, { order: "asc" });

    expect(operations).toHaveLength(1);
    expect(token).toBe("CURSOR_ABC");
  });

  it("should propagate network errors", async () => {
    mockGetAccountTransactions.mockRejectedValue(new Error("Network error"));

    await expect(listOperations(address, { order: "desc" })).rejects.toThrow("Network error");
  });
});
