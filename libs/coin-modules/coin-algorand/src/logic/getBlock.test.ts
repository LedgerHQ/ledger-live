import BigNumber from "bignumber.js";
import * as network from "../network";
import type {
  ExplorerAmount,
  ExplorerInnerTransaction,
  ExplorerTransaction,
} from "../network/types";
import { mockAlgorandConfig, mockAlgorandContext } from "../test/context";
import { getBlock } from "./getBlock";
import { listOperations } from "./listOperations";

jest.mock("../network");

const mockGetAccountTransactions = network.getAccountTransactions as jest.MockedFunction<
  typeof network.getAccountTransactions
>;
const mockGetBlock = network.getBlock as jest.MockedFunction<typeof network.getBlock>;
const mockGetBlockHash = network.getBlockHash as jest.MockedFunction<typeof network.getBlockHash>;
const mockGetBlockTransactions = network.getBlockTransactions as jest.MockedFunction<
  typeof network.getBlockTransactions
>;

type Transaction = ExplorerTransaction<ExplorerAmount>;
type InnerTransaction = ExplorerInnerTransaction<ExplorerAmount>;

const HEIGHT = 66607655;
const ALICE = "ALICE";
const BOB = "BOB";
const CAROL = "CAROL";

function innerTransaction(fields: Partial<InnerTransaction>): InnerTransaction {
  return {
    "close-rewards": 0,
    "closing-amount": 0,
    "confirmed-round": HEIGHT,
    fee: 0,
    "first-valid": HEIGHT - 10,
    "genesis-hash": "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
    "genesis-id": "mainnet-v1.0",
    "global-state-delta": [],
    "intra-round-offset": 0,
    "last-valid": HEIGHT + 990,
    "local-state-delta": [],
    note: "",
    "receiver-rewards": 0,
    "round-time": 1793724956,
    sender: ALICE,
    "sender-rewards": 0,
    signature: { sig: "" },
    "tx-type": "pay",
    ...fields,
  };
}

function transaction(fields: Partial<Transaction>): Transaction {
  return { id: "TX", ...innerTransaction({ fee: 1000 }), ...fields };
}

function payment(
  amount: ExplorerAmount,
  receiver: string,
  close?: { amount: ExplorerAmount; to: string },
): Transaction["payment-transaction"] {
  return {
    amount,
    receiver,
    "close-amount": close?.amount ?? 0,
    ...(close ? { "close-remainder-to": close.to } : {}),
  };
}

function assetTransfer(
  fields: Partial<NonNullable<Transaction["asset-transfer-transaction"]>>,
): Transaction["asset-transfer-transaction"] {
  return { amount: 0, "asset-id": 31566704, "close-amount": 0, receiver: BOB, ...fields };
}

const NATIVE = { type: "native" };
const USDC = { type: "asa", assetReference: "31566704" };

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBlock.mockResolvedValue({
      block: { rnd: HEIGHT, ts: 1793724956, gh: "GENESIS", prev: "blk-PARENT" },
    });
    mockGetBlockHash.mockResolvedValue("BLOCK");
    mockGetBlockTransactions.mockResolvedValue([]);
  });

  it("returns the block info of the round", async () => {
    const block = await getBlock(mockAlgorandContext, HEIGHT);

    expect(mockGetBlockTransactions).toHaveBeenCalledWith(mockAlgorandConfig, HEIGHT);
    expect(block).toEqual({
      info: {
        height: HEIGHT,
        hash: "BLOCK",
        time: new Date(1793724956000),
        parent: { height: HEIGHT - 1, hash: "PARENT" },
      },
      transactions: [],
    });
  });

  it("maps a payment to a native transfer paid by its sender", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({ id: "PAY", fee: 1000, "payment-transaction": payment(5000000, BOB) }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions).toEqual([
      {
        hash: "PAY",
        failed: false,
        operations: [
          { type: "transfer", address: ALICE, peer: BOB, asset: NATIVE, amount: -5000000n },
          { type: "transfer", address: BOB, peer: ALICE, asset: NATIVE, amount: 5000000n },
        ],
        fees: 1000n,
        feesPayer: ALICE,
        details: { txType: "pay" },
      },
    ]);
  });

  it("adds the remainder sent to the close address of a payment", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({ "payment-transaction": payment(100, BOB, { amount: 900, to: CAROL }) }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0].operations).toEqual([
      { type: "transfer", address: ALICE, peer: BOB, asset: NATIVE, amount: -100n },
      { type: "transfer", address: BOB, peer: ALICE, asset: NATIVE, amount: 100n },
      { type: "transfer", address: ALICE, peer: CAROL, asset: NATIVE, amount: -900n },
      { type: "transfer", address: CAROL, peer: ALICE, asset: NATIVE, amount: 900n },
    ]);
  });

  it("maps an asset transfer and its close remainder to ASA transfers", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        "tx-type": "axfer",
        "asset-transfer-transaction": assetTransfer({
          amount: 250,
          "close-amount": 750,
          "close-to": CAROL,
        }),
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0]).toMatchObject({ fees: 1000n, feesPayer: ALICE });
    expect(transactions[0].operations).toEqual([
      { type: "transfer", address: ALICE, peer: BOB, asset: USDC, amount: -250n },
      { type: "transfer", address: BOB, peer: ALICE, asset: USDC, amount: 250n },
      { type: "transfer", address: ALICE, peer: CAROL, asset: USDC, amount: -750n },
      { type: "transfer", address: CAROL, peer: ALICE, asset: USDC, amount: 750n },
      { type: "other", address: ALICE, asset: USDC, ledgerOpType: "OPT_OUT" },
    ]);
  });

  it("adds an OPT_IN operation to a zero self-transfer without a close address", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        "tx-type": "axfer",
        "asset-transfer-transaction": assetTransfer({ amount: 0, receiver: ALICE }),
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0].operations).toContainEqual({
      type: "other",
      address: ALICE,
      asset: USDC,
      ledgerOpType: "OPT_IN",
    });
  });
  it("does not add an OPT_IN operation to a zero clawback self-transfer", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        sender: "MANAGER",
        "tx-type": "axfer",
        "asset-transfer-transaction": assetTransfer({ amount: 0, receiver: ALICE, sender: ALICE }),
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0].operations).not.toContainEqual(
      expect.objectContaining({ type: "other", ledgerOpType: "OPT_IN" }),
    );
  });
  it("takes a clawback from the revoked account, not from the asset manager", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        sender: "MANAGER",
        "tx-type": "axfer",
        "asset-transfer-transaction": assetTransfer({ amount: 10, sender: CAROL }),
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0]).toMatchObject({ feesPayer: "MANAGER" });
    expect(transactions[0].operations).toEqual([
      { type: "transfer", address: CAROL, peer: BOB, asset: USDC, amount: -10n },
      { type: "transfer", address: BOB, peer: CAROL, asset: USDC, amount: 10n },
    ]);
  });

  it("flattens the transfers of inner transactions into their parent", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        id: "APPL",
        "tx-type": "appl",
        "inner-txns": [
          innerTransaction({
            sender: "APP",
            fee: 2000,
            "tx-type": "appl",
            "inner-txns": [
              innerTransaction({
                sender: "APP",
                "tx-type": "axfer",
                "asset-transfer-transaction": assetTransfer({ amount: 42, receiver: ALICE }),
              }),
            ],
          }),
        ],
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions).toEqual([
      {
        hash: "APPL",
        failed: false,
        operations: [
          { type: "transfer", address: "APP", peer: ALICE, asset: USDC, amount: -42n },
          { type: "transfer", address: ALICE, peer: "APP", asset: USDC, amount: 42n },
        ],
        fees: 1000n,
        feesPayer: ALICE,
        details: { txType: "appl" },
      },
    ]);
  });

  it("keeps a transaction without transfer for its fees", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({ id: "KEYREG", "tx-type": "keyreg" }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions).toEqual([
      {
        hash: "KEYREG",
        failed: false,
        operations: [],
        fees: 1000n,
        feesPayer: ALICE,
        details: { txType: "keyreg" },
      },
    ]);
  });

  it("credits the participation rewards of the touched accounts", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        "payment-transaction": payment(100, BOB, { amount: 900, to: CAROL }),
        "sender-rewards": 1,
        "receiver-rewards": 2,
        "close-rewards": 3,
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0].operations).toEqual(
      expect.arrayContaining([
        { type: "transfer", address: ALICE, asset: NATIVE, amount: 1n },
        { type: "transfer", address: BOB, asset: NATIVE, amount: 2n },
        { type: "transfer", address: CAROL, asset: NATIVE, amount: 3n },
      ]),
    );
    expect(transactions[0].operations).toHaveLength(7);
  });

  it("keeps the exact value of an amount above the safe integer range", async () => {
    const amount = 2n ** 64n - 1n;
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        "tx-type": "axfer",
        "asset-transfer-transaction": assetTransfer({ amount }),
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0].operations).toEqual([
      { type: "transfer", address: ALICE, peer: BOB, asset: USDC, amount: -amount },
      { type: "transfer", address: BOB, peer: ALICE, asset: USDC, amount },
    ]);
  });

  it("closes an account with nothing left when the indexer omits the close amount", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        "payment-transaction": { amount: 100, receiver: BOB, "close-remainder-to": CAROL },
      }),
      transaction({
        "tx-type": "axfer",
        "asset-transfer-transaction": {
          amount: 0,
          "asset-id": 31566704,
          receiver: BOB,
          "close-to": CAROL,
        },
      }),
    ]);

    const { transactions } = await getBlock(mockAlgorandContext, HEIGHT);

    expect(transactions[0].operations).toEqual([
      { type: "transfer", address: ALICE, peer: BOB, asset: NATIVE, amount: -100n },
      { type: "transfer", address: BOB, peer: ALICE, asset: NATIVE, amount: 100n },
      { type: "transfer", address: ALICE, peer: CAROL, asset: NATIVE, amount: 0n },
      { type: "transfer", address: CAROL, peer: ALICE, asset: NATIVE, amount: 0n },
    ]);
    expect(transactions[1].operations).toEqual([
      { type: "transfer", address: ALICE, peer: BOB, asset: USDC, amount: 0n },
      { type: "transfer", address: BOB, peer: ALICE, asset: USDC, amount: 0n },
      { type: "transfer", address: ALICE, peer: CAROL, asset: USDC, amount: 0n },
      { type: "transfer", address: CAROL, peer: ALICE, asset: USDC, amount: 0n },
      { type: "other", address: ALICE, asset: USDC, ledgerOpType: "OPT_OUT" },
    ]);
  });

  it("keeps signed list operation amounts consistent with block transfers by address and asset", async () => {
    mockGetBlockTransactions.mockResolvedValue([
      transaction({
        id: "PAY",
        "payment-transaction": payment(100, ALICE, { amount: 900, to: CAROL }),
      }),
      transaction({
        id: "ASA",
        "tx-type": "axfer",
        "asset-transfer-transaction": assetTransfer({
          amount: 250,
          "close-amount": 750,
          "close-to": CAROL,
        }),
      }),
    ]);
    mockGetAccountTransactions.mockResolvedValue({
      nextToken: undefined,
      transactions: [
        {
          id: "PAY",
          type: "pay",
          senderAddress: ALICE,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          closeRewards: undefined,
          closeAmount: undefined,
          fee: new BigNumber(1000),
          timestamp: "1793724956",
          round: HEIGHT,
          note: "",
          details: {
            amount: new BigNumber(100),
            closeAmount: new BigNumber(900),
            closeToAddress: CAROL,
            recipientAddress: ALICE,
          },
        },
        {
          id: "ASA",
          type: "axfer",
          senderAddress: ALICE,
          senderRewards: new BigNumber(0),
          recipientRewards: new BigNumber(0),
          closeRewards: undefined,
          closeAmount: undefined,
          fee: new BigNumber(1000),
          timestamp: "1793724956",
          round: HEIGHT,
          note: "",
          details: {
            assetAmount: new BigNumber(250),
            assetCloseAmount: new BigNumber(750),
            assetCloseToAddress: CAROL,
            assetId: "31566704",
            assetRecipientAddress: BOB,
            assetSenderAddress: undefined,
          },
        },
      ],
    });

    const [block, { items }] = await Promise.all([
      getBlock(mockAlgorandContext, HEIGHT),
      listOperations(mockAlgorandContext, ALICE, { order: "asc" }),
    ]);
    const blockAmounts = block.transactions
      .flatMap(blockTransaction => blockTransaction.operations)
      .reduce((amounts, operation) => {
        if (operation.type === "transfer" && operation.address === ALICE) {
          const assetReference = operation.asset.assetReference ?? "native";
          amounts.set(assetReference, (amounts.get(assetReference) ?? 0n) + operation.amount);
        }
        return amounts;
      }, new Map<string, bigint>());
    const listAmounts = items.reduce((amounts, operation) => {
      const assetReference = operation.asset.assetReference ?? "native";
      const signedValue =
        operation.type === "IN" || operation.type === "REWARD" ? operation.value : -operation.value;
      amounts.set(assetReference, (amounts.get(assetReference) ?? 0n) + signedValue);
      return amounts;
    }, new Map<string, bigint>());

    expect(listAmounts).toEqual(blockAmounts);
  });
  it("does not query the indexer for a round the node does not know", async () => {
    mockGetBlockHash.mockRejectedValue(new Error("failed to retrieve information from the ledger"));

    await expect(getBlock(mockAlgorandContext, HEIGHT)).rejects.toThrow(
      "failed to retrieve information from the ledger",
    );
    expect(mockGetBlockTransactions).not.toHaveBeenCalled();
  });
});
