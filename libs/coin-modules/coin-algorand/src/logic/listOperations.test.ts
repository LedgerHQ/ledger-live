import BigNumber from "bignumber.js";
import * as network from "../network";
import { AlgoTransactionType } from "../network";
import { listOperations } from "./listOperations";
import { mockAlgorandContext, mockAlgorandConfig } from "../test/context";

jest.mock("../network");

const mockGetAccountTransactions = network.getAccountTransactions as jest.MockedFunction<
  typeof network.getAccountTransactions
>;

const asaTransfer = (fields: {
  id?: string;
  rootId?: string;
  sender: string;
  recipient: string;
  amount: number;
  feesPayer?: string;
  note?: string;
}) => ({
  id: fields.id ?? "ASA",
  rootId: fields.rootId ?? fields.id ?? "ASA",
  type: AlgoTransactionType.ASSET_TRANSFER,
  senderAddress: fields.sender,
  feesPayer: fields.feesPayer ?? fields.sender,
  fee: new BigNumber("1000"),
  round: 1000000,
  timestamp: "1700000000",
  note: fields.note,
  senderRewards: new BigNumber(0),
  recipientRewards: new BigNumber(0),
  details: {
    assetAmount: new BigNumber(fields.amount),
    assetId: "123",
    assetRecipientAddress: fields.recipient,
    assetSenderAddress: undefined,
    assetCloseAmount: undefined,
    assetCloseToAddress: undefined,
  },
});

describe("listOperations", () => {
  const address = "ALGO_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array when no transactions", async () => {
    mockGetAccountTransactions.mockResolvedValue({ transactions: [], nextToken: undefined });

    const { items, next } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items).toEqual([]);
    expect(next).toBe("");
  });

  it("should convert payment transaction to OUT operation for sender", async () => {
    const tx = {
      id: "TX_123",
      rootId: "TX_123",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      feesPayer: address,
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("OUT");
    expect(items[0].value).toBe(1000000n);
    expect(items[0].senders).toEqual([address]);
    expect(items[0].recipients).toEqual(["RECIPIENT_ADDRESS"]);
    expect(items[0].asset).toEqual({ type: "native" });
  });

  it("should convert payment transaction to IN operation for recipient", async () => {
    const tx = {
      id: "TX_456",
      rootId: "TX_456",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: "SENDER_ADDRESS",
      feesPayer: "SENDER_ADDRESS",
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[0].type).toBe("IN");
    expect(items[0].value).toBe(500000n);
    expect(items[0].senders).toEqual(["SENDER_ADDRESS"]);
    expect(items[0].recipients).toEqual([address]);
    expect(items[0].asset).toEqual({ type: "native" });
  });

  it("should give the close amount of a payment its own row, with the parties of that movement", async () => {
    const tx = {
      id: "TX_CLOSE",
      rootId: "TX_CLOSE",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      feesPayer: address,
      fee: new BigNumber("1000"),
      round: 1000006,
      timestamp: "1700000600",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      closeRewards: undefined,
      details: {
        amount: new BigNumber("100"),
        recipientAddress: "RECIPIENT_ADDRESS",
        closeToAddress: "CLOSE_ADDRESS",
        closeAmount: new BigNumber("900"),
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [
        { id: "TX_CLOSE", type: "OUT", value: 100n, recipients: ["RECIPIENT_ADDRESS"] },
        { id: "TX_CLOSE-close", type: "OUT", value: 900n, recipients: ["CLOSE_ADDRESS"] },
      ],
    });

    await expect(
      listOperations(mockAlgorandContext, "CLOSE_ADDRESS", { order: "desc" }),
    ).resolves.toMatchObject({
      items: [{ id: "TX_CLOSE-close", type: "IN", value: 900n, senders: [address] }],
    });
    await expect(
      listOperations(mockAlgorandContext, "RECIPIENT_ADDRESS", { order: "desc" }),
    ).resolves.toMatchObject({ items: [{ id: "TX_CLOSE", type: "IN", value: 100n }] });
  });

  it("should convert asset transfer to operation with asa type", async () => {
    const tx = {
      id: "TX_789",
      rootId: "TX_789",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      feesPayer: address,
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[0].type).toBe("OUT");
    expect(items[0].value).toBe(100n);
    expect(items[0].asset).toEqual({ type: "asa", assetReference: "12345" });
  });

  it("should use the clawback source as the ASA sender", async () => {
    const tx = {
      id: "TX_CLAWBACK",
      rootId: "TX_CLAWBACK",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: "ASSET_MANAGER",
      feesPayer: "ASSET_MANAGER",
      fee: new BigNumber("1000"),
      round: 1000006,
      timestamp: "1700000600",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("100"),
        assetRecipientAddress: "RECIPIENT_ADDRESS",
        assetSenderAddress: address,
        assetId: "12345",
        assetCloseToAddress: undefined,
        assetCloseAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [{ type: "OUT", value: 100n, senders: [address] }],
    });
  });
  it("should detect OPT_IN operation", async () => {
    const tx = {
      id: "TX_OPTIN",
      rootId: "TX_OPTIN",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      feesPayer: address,
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[0].type).toBe("OPT_IN");
    expect(items[0].details).toEqual({
      ledgerOpType: "OPT_IN",
    });
  });

  it("should keep the memo next to the OPT_IN details when note is present", async () => {
    const tx = {
      id: "TX_OPTIN_NOTE",
      rootId: "TX_OPTIN_NOTE",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      feesPayer: address,
      fee: new BigNumber("1000"),
      round: 1000003,
      timestamp: "1700000300",
      note: "b3B0LWlu",
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("0"),
        assetRecipientAddress: address,
        assetId: "67890",
        assetCloseToAddress: undefined,
        assetCloseAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[0].details).toEqual({
      memo: { type: "string", kind: "note", value: "b3B0LWlu" },
      ledgerOpType: "OPT_IN",
    });
  });

  it("should not classify a zero clawback self-transfer as OPT_IN", async () => {
    const tx = {
      id: "TX_CLAWBACK_SELF",
      rootId: "TX_CLAWBACK_SELF",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: "ASSET_MANAGER",
      feesPayer: "ASSET_MANAGER",
      fee: new BigNumber("1000"),
      round: 1000006,
      timestamp: "1700000600",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("0"),
        assetRecipientAddress: address,
        assetSenderAddress: address,
        assetId: "12345",
        assetCloseToAddress: undefined,
        assetCloseAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({ items: [{ type: "OUT", value: 0n }] });
  });
  it("should detect OPT_OUT operation", async () => {
    const tx = {
      id: "TX_OPTOUT",
      rootId: "TX_OPTOUT",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      feesPayer: address,
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[0].type).toBe("OPT_OUT");
    expect(items[0].details).toEqual({
      ledgerOpType: "OPT_OUT",
    });
  });

  it("should include the ASA close amount in the sender OPT_OUT value", async () => {
    const tx = {
      id: "TX_OPTOUT",
      rootId: "TX_OPTOUT",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      feesPayer: address,
      fee: new BigNumber("1000"),
      round: 1000004,
      timestamp: "1700000400",
      note: undefined,
      senderRewards: new BigNumber("0"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("50"),
        assetRecipientAddress: "RECIPIENT_ADDRESS",
        assetSenderAddress: undefined,
        assetId: "11111",
        assetCloseToAddress: "CLOSE_ADDRESS",
        assetCloseAmount: new BigNumber("100"),
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [
        { type: "OPT_OUT", value: 150n, recipients: ["RECIPIENT_ADDRESS", "CLOSE_ADDRESS"] },
        { id: "TX_OPTOUT-fees", type: "FEES", value: 0n, senders: [address], tx: { fees: 1000n } },
      ],
    });
    const { items } = await listOperations(mockAlgorandContext, "CLOSE_ADDRESS", {
      order: "desc",
    });
    expect(items).toMatchObject([{ id: "TX_OPTOUT-close", type: "IN", value: 100n }]);
    expect(items[0].details).toEqual({
      ledgerOpType: "IN",
      assetAmount: "100",
      assetSenders: [address],
      assetRecipients: ["CLOSE_ADDRESS"],
    });
  });
  it("should include memo when note is present", async () => {
    const tx = {
      id: "TX_MEMO",
      rootId: "TX_MEMO",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      feesPayer: address,
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[0].details).toEqual({
      memo: {
        type: "string",
        kind: "note",
        value: "Test memo",
      },
    });
  });

  it("should create a separate reward operation for rewards credited to the observed account", async () => {
    const tx = {
      id: "TX_REWARDS",
      rootId: "TX_REWARDS",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      feesPayer: address,
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: "TX_REWARDS", type: "OUT", value: 1000000n });
    expect(items[1]).toMatchObject({
      id: "TX_REWARDS-reward-ALGO_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      type: "REWARD",
      value: 500n,
      senders: [],
      recipients: [address],
      tx: { fees: 0n },
    });
  });

  it("should keep only the memo in the details of the reward operation of an OPT_IN", async () => {
    const tx = {
      id: "TX_OPTIN_REWARDS",
      rootId: "TX_OPTIN_REWARDS",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      feesPayer: address,
      fee: new BigNumber("1000"),
      round: 1000006,
      timestamp: "1700000600",
      note: "b3B0LWlu",
      senderRewards: new BigNumber("500"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("0"),
        assetRecipientAddress: address,
        assetId: "67890",
        assetCloseToAddress: undefined,
        assetCloseAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items.map(item => item.type)).toEqual(["OPT_IN", "REWARD", "FEES"]);
    expect(items[1].details).toEqual({
      memo: { type: "string", kind: "note", value: "b3B0LWlu" },
    });
  });

  it("should give no details to the reward operation of an OPT_IN without note", async () => {
    const tx = {
      id: "TX_OPTIN_REWARDS_NO_NOTE",
      rootId: "TX_OPTIN_REWARDS_NO_NOTE",
      type: AlgoTransactionType.ASSET_TRANSFER,
      senderAddress: address,
      feesPayer: address,
      fee: new BigNumber("1000"),
      round: 1000006,
      timestamp: "1700000600",
      note: undefined,
      senderRewards: new BigNumber("500"),
      recipientRewards: new BigNumber("0"),
      details: {
        assetAmount: new BigNumber("0"),
        assetRecipientAddress: address,
        assetId: "67890",
        assetCloseToAddress: undefined,
        assetCloseAmount: undefined,
      },
    };

    mockGetAccountTransactions.mockResolvedValue({ transactions: [tx], nextToken: undefined });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items.map(item => item.type)).toEqual(["OPT_IN", "REWARD", "FEES"]);
    expect(items[1]).not.toHaveProperty("details");
  });

  it("should sort operations in descending order", async () => {
    const txs = [
      {
        id: "TX_1",
        rootId: "TX_1",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        feesPayer: address,
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
        rootId: "TX_2",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        feesPayer: address,
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
        rootId: "TX_3",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        feesPayer: address,
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

    const { items, next } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[0].tx.block.height).toBe(3000);
    expect(items[1].tx.block.height).toBe(2000);
    expect(items[2].tx.block.height).toBe(1000);
    expect(next).toBe("NEXT_TOKEN");
  });

  it("should sort operations in ascending order", async () => {
    const txs = [
      {
        id: "TX_1",
        rootId: "TX_1",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        feesPayer: address,
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
        rootId: "TX_2",
        type: AlgoTransactionType.PAYMENT,
        senderAddress: address,
        feesPayer: address,
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

    const { items } = await listOperations(mockAlgorandContext, address, { order: "asc" });

    expect(items[0].tx.block.height).toBe(1000);
    expect(items[1].tx.block.height).toBe(3000);
  });

  it("should return a FEES operation for an application transaction without movement", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "APPL",
          rootId: "APPL",
          type: "appl",
          senderAddress: address,
          feesPayer: address,
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: undefined,
        },
      ],
      nextToken: undefined,
    });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [
        {
          id: "APPL",
          type: "FEES",
          value: 0n,
          asset: { type: "native" },
          tx: { fees: 1000n, feesPayer: address },
        },
      ],
    });
  });

  it("should return an inner payment to the account without the root fee", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "APPL",
          rootId: "APPL",
          type: "appl",
          senderAddress: "ROOT_SENDER",
          feesPayer: "ROOT_SENDER",
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: undefined,
        },
        {
          id: "APPL-inner-0",
          rootId: "APPL",
          type: AlgoTransactionType.PAYMENT,
          senderAddress: "APP",
          feesPayer: "ROOT_SENDER",
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: {
            amount: new BigNumber(100),
            recipientAddress: address,
            closeAmount: undefined,
            closeToAddress: undefined,
          },
        },
      ],
      nextToken: undefined,
    });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [
        {
          id: "APPL-inner-0",
          type: "IN",
          value: 100n,
          tx: { fees: 1000n, feesPayer: "ROOT_SENDER" },
        },
      ],
    });
  });

  it("should not return a FEES operation when an inner movement of the fee payer carries the fee", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "APPL",
          rootId: "APPL",
          type: "appl",
          senderAddress: address,
          feesPayer: address,
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: undefined,
        },
        {
          id: "APPL-inner-0",
          rootId: "APPL",
          type: AlgoTransactionType.PAYMENT,
          senderAddress: "APP",
          feesPayer: address,
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: {
            amount: new BigNumber(50),
            recipientAddress: address,
            closeAmount: undefined,
            closeToAddress: undefined,
          },
        },
      ],
      nextToken: undefined,
    });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "APPL-inner-0",
      type: "IN",
      value: 50n,
      tx: { hash: "APPL", fees: 1000n, feesPayer: address },
    });
  });

  it("should return nested inner ASA movement with root fee metadata", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "APPL-inner-0-inner-0",
          rootId: "APPL",
          type: AlgoTransactionType.ASSET_TRANSFER,
          senderAddress: address,
          feesPayer: "ROOT_SENDER",
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: {
            assetAmount: new BigNumber(42),
            assetId: "31566704",
            assetRecipientAddress: "RECIPIENT",
            assetSenderAddress: undefined,
            assetCloseAmount: undefined,
            assetCloseToAddress: undefined,
          },
        },
      ],
      nextToken: undefined,
    });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [
        {
          type: "OUT",
          value: 42n,
          asset: { type: "asa", assetReference: "31566704" },
          tx: { fees: 1000n, feesPayer: "ROOT_SENDER" },
        },
      ],
    });
  });

  it.each(["keyreg", "acfg"])("should return a FEES operation for %s", async type => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: type,
          rootId: type,
          type,
          senderAddress: address,
          feesPayer: address,
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: undefined,
        },
      ],
      nextToken: undefined,
    });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({ items: [{ type: "FEES", value: 0n }] });
  });

  it("should create a FEES operation for a clawback submitter", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "CLAWBACK",
          rootId: "CLAWBACK",
          type: AlgoTransactionType.ASSET_TRANSFER,
          senderAddress: address,
          feesPayer: address,
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(25),
          recipientRewards: new BigNumber(0),
          details: {
            assetAmount: new BigNumber(100),
            assetId: "123",
            assetRecipientAddress: "RECIPIENT",
            assetSenderAddress: "SOURCE",
            assetCloseAmount: undefined,
            assetCloseToAddress: undefined,
          },
        },
      ],
      nextToken: undefined,
    });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [
        { type: "REWARD", value: 25n, tx: { fees: 0n } },
        {
          type: "FEES",
          value: 0n,
          asset: { type: "native" },
          senders: [address],
          tx: { fees: 1000n },
        },
      ],
    });
  });

  it("should ignore inner movements unrelated to the observed account", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "APPL-inner-0",
          rootId: "APPL",
          type: AlgoTransactionType.PAYMENT,
          senderAddress: "APP",
          feesPayer: "ROOT_SENDER",
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          details: {
            amount: new BigNumber(100),
            recipientAddress: "UNRELATED",
            closeAmount: undefined,
            closeToAddress: undefined,
          },
        },
      ],
      nextToken: undefined,
    });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({ items: [] });
  });

  it("should create a reward operation for a non-transfer root transaction", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "KEYREG",
          rootId: "KEYREG",
          type: "keyreg",
          senderAddress: address,
          feesPayer: address,
          fee: new BigNumber("1000"),
          round: 1000000,
          timestamp: "1700000000",
          note: undefined,
          senderRewards: new BigNumber(25),
          recipientRewards: new BigNumber(0),
          details: undefined,
        },
      ],
      nextToken: undefined,
    });

    await expect(
      listOperations(mockAlgorandContext, address, { order: "desc" }),
    ).resolves.toMatchObject({
      items: [
        { type: "REWARD", value: 25n, tx: { fees: 0n } },
        { type: "FEES", value: 0n, tx: { fees: 1000n } },
      ],
    });
  });

  // The details coin-evm and coin-tezos set on token rows, which A4 also sets on the token operations of a block
  it("should give an ASA transfer the token details", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [asaTransfer({ sender: "SENDER", recipient: address, amount: 5 })],
      nextToken: undefined,
    });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items).toEqual([
      expect.objectContaining({
        type: "IN",
        details: {
          ledgerOpType: "IN",
          assetAmount: "5",
          assetSenders: ["SENDER"],
          assetRecipients: [address],
        },
      }),
    ]);
  });

  // The fee payer of a transaction without native row gets a FEES row, last (ADR-0028 fee payer rule in A4)
  it("should give the fee payer of an ASA send and of an opt-in a FEES row, after the token row", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        asaTransfer({ id: "SEND", sender: address, recipient: "RECIPIENT", amount: 5 }),
        asaTransfer({ id: "OPTIN", sender: address, recipient: address, amount: 0 }),
      ],
      nextToken: undefined,
    });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(
      items.map(({ id, type, senders, recipients }) => ({ id, type, senders, recipients })),
    ).toEqual([
      { id: "SEND", type: "OUT", senders: [address], recipients: ["RECIPIENT"] },
      { id: "SEND-fees", type: "FEES", senders: [address], recipients: [] },
      { id: "OPTIN", type: "OPT_IN", senders: [address], recipients: [address] },
      { id: "OPTIN-fees", type: "FEES", senders: [address], recipients: [] },
    ]);
  });

  it("should give the FEES row of an ASA send the note of its transaction", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        asaTransfer({
          id: "SEND",
          sender: address,
          recipient: "RECIPIENT",
          amount: 5,
          note: "aGk=",
        }),
      ],
      nextToken: undefined,
    });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items[1]).toMatchObject({
      id: "SEND-fees",
      type: "FEES",
      details: { memo: { type: "string", kind: "note", value: "aGk=" } },
    });
  });

  it("should keep the FEES row of an application call whose inner transaction sends an ASA to its fee payer", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          ...asaTransfer({ id: "APPL", sender: address, recipient: "APP", amount: 0 }),
          type: "appl",
          details: undefined,
        },
        asaTransfer({
          id: "APPL-inner-0",
          rootId: "APPL",
          sender: "APP",
          recipient: address,
          amount: 1,
          feesPayer: address,
        }),
      ],
      nextToken: undefined,
    });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items.map(({ id, type }) => ({ id, type }))).toEqual([
      { id: "APPL-inner-0", type: "IN" },
      { id: "APPL", type: "FEES" },
    ]);
  });

  it("should give a row to each movement of a payment whose receiver is also its close address", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          ...asaTransfer({ id: "CLOSE", sender: address, recipient: "RECIPIENT", amount: 0 }),
          type: AlgoTransactionType.PAYMENT,
          details: {
            amount: new BigNumber(3000),
            recipientAddress: "RECIPIENT",
            closeAmount: new BigNumber(396000),
            closeToAddress: "RECIPIENT",
          },
        },
      ],
      nextToken: undefined,
    });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items).toEqual([
      expect.objectContaining({
        id: "CLOSE",
        type: "OUT",
        value: 3000n,
        recipients: ["RECIPIENT"],
      }),
      expect.objectContaining({
        id: "CLOSE-close",
        type: "OUT",
        value: 396000n,
        recipients: ["RECIPIENT"],
      }),
    ]);
  });

  // A4 drops the 0 transfer of the receiver on the block path
  it("should give no row to the 0 receiver movement of a payment that only closes the account", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          ...asaTransfer({ id: "CLOSE", sender: address, recipient: "RECIPIENT", amount: 0 }),
          type: AlgoTransactionType.PAYMENT,
          details: {
            amount: new BigNumber(0),
            recipientAddress: "RECIPIENT",
            closeAmount: new BigNumber(396000),
            closeToAddress: "CLOSE_ADDRESS",
          },
        },
      ],
      nextToken: undefined,
    });

    const sender = await listOperations(mockAlgorandContext, address, { order: "desc" });
    const receiver = await listOperations(mockAlgorandContext, "RECIPIENT", { order: "desc" });

    expect(sender.items.map(({ id, type, value }) => ({ id, type, value }))).toEqual([
      { id: "CLOSE-close", type: "OUT", value: 396000n },
    ]);
    expect(receiver.items).toEqual([]);
  });

  it("should return a FEES operation for non-transfer transactions", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          id: "TX_OTHER",
          rootId: "TX_OTHER",
          type: "keyreg" as AlgoTransactionType,
          senderAddress: address,
          feesPayer: address,
          fee: new BigNumber("1000"),
          round: 2000,
          timestamp: "1700001000",
          note: undefined,
          senderRewards: new BigNumber("0"),
          recipientRewards: new BigNumber("0"),
          details: {},
        },
      ],
      nextToken: undefined,
    });

    const { items } = await listOperations(mockAlgorandContext, address, { order: "desc" });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "TX_OTHER", type: "FEES", value: 0n });
  });

  it("should forward pagination options to getAccountTransactions", async () => {
    mockGetAccountTransactions.mockResolvedValue({ transactions: [], nextToken: undefined });

    await listOperations(mockAlgorandContext, address, {
      order: "asc",
      minHeight: 5000,
      limit: 50,
      cursor: "PAGE_TOKEN",
    });

    expect(mockGetAccountTransactions).toHaveBeenCalledWith(mockAlgorandConfig, address, {
      minRound: 5000,
      limit: 50,
      nextToken: "PAGE_TOKEN",
      includeInnerTransactions: true,
    });
  });

  it("should return next token from paginated response", async () => {
    const tx = {
      id: "TX_PAGE",
      rootId: "TX_PAGE",
      type: AlgoTransactionType.PAYMENT,
      senderAddress: address,
      feesPayer: address,
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

    const { items, next } = await listOperations(mockAlgorandContext, address, { order: "asc" });

    expect(items).toHaveLength(1);
    expect(next).toBe("CURSOR_ABC");
  });

  it("should propagate network errors", async () => {
    mockGetAccountTransactions.mockRejectedValue(new Error("Network error"));

    await expect(listOperations(mockAlgorandContext, address, { order: "desc" })).rejects.toThrow(
      "Network error",
    );
  });
});
