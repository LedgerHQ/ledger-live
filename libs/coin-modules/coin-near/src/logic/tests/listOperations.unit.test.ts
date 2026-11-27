import { mockNearContext } from "../../test/context";
import { fetchTransactionsPage, readReceiptTransfers } from "../../network";
import type { NearReceiptTransfer, NearTransaction } from "../../network/sdk.types";
import { listOperations, toOperation } from "../listOperations";

jest.mock("../../network", () => ({
  fetchTransactionsPage: jest.fn(),
  readReceiptTransfers: jest.fn(),
}));

const ADDRESS = "delegator.near";
const PEER = "recipient.near";
const FEE = "23000000000000000000";
const DEPOSIT = "5000000000000000000000000";

/** exactOptionalPropertyTypes is on, so an explicit `undefined` override needs the union. */
type Overrides<T> = { [K in keyof T]?: T[K] | undefined };

const transaction = (overrides: Overrides<NearTransaction> = {}): NearTransaction =>
  ({
    signer_account_id: ADDRESS,
    receiver_account_id: PEER,
    transaction_hash: "GkQ7Uh8oPPGtVfyPz1yLKmqPqZ8ZyxvGtN5MmYq8mF1w",
    block_timestamp: "1750000000000000000",
    outcomes_agg: { transaction_fee: FEE },
    outcomes: { status: true },
    block: { block_hash: "BlockHash1", block_height: "140000000" },
    actions_agg: { deposit: DEPOSIT },
    actions: [{ action: "TRANSFER", method: null }],
    ...overrides,
  }) as NearTransaction;

const transfer = (overrides: Partial<NearReceiptTransfer> = {}): NearReceiptTransfer => ({
  transactionHash: "payout-hash",
  sender: "intents.near",
  value: "7000000000000000000000000",
  blockHeight: 140_000_005,
  blockHash: "ReceiptBlock",
  date: new Date(1_750_000_005_000),
  ...overrides,
});

const mockReceipts = (transfers: NearReceiptTransfer[] = [], resumeCursor?: string) =>
  (readReceiptTransfers as jest.Mock).mockResolvedValue({
    transfers,
    exhausted: resumeCursor === undefined,
    ...(resumeCursor !== undefined && { resumeCursor }),
  });

const decode = (token: string | undefined) =>
  JSON.parse(Buffer.from(token ?? "", "base64url").toString("utf8"));
const encode = (cursor: object) => Buffer.from(JSON.stringify(cursor)).toString("base64url");

const mockPage = (transactions: NearTransaction[], next?: string) =>
  (fetchTransactionsPage as jest.Mock).mockResolvedValue({ transactions, next });

describe("toOperation", () => {
  it("excludes the fee from an outgoing value, because the framework adds it on top", () => {
    const operation = toOperation(transaction(), ADDRESS);

    expect(operation.type).toBe("OUT");
    expect(operation.value).toBe(BigInt(DEPOSIT));
    expect(operation.tx.fees).toBe(BigInt(FEE));
  });

  it("reports the raw deposit for an incoming operation", () => {
    const operation = toOperation(
      transaction({ signer_account_id: PEER, receiver_account_id: ADDRESS }),
      ADDRESS,
    );

    expect(operation.type).toBe("IN");
    expect(operation.value).toBe(BigInt(DEPOSIT));
  });

  it.each([
    ["deposit_and_stake", "STAKE"],
    ["unstake", "UNSTAKE"],
    ["unstake_all", "UNSTAKE"],
    ["withdraw", "WITHDRAW_UNSTAKED"],
    ["withdraw_all", "WITHDRAW_UNSTAKED"],
  ])("classifies the %s call as %s", (method, expected) => {
    const operation = toOperation(
      transaction({ actions: [{ action: "FUNCTION_CALL", method }] }),
      ADDRESS,
    );

    expect(operation.type).toBe(expected);
  });

  it.each([
    ["a plain deposit", [{ action: "FUNCTION_CALL", method: "deposit" }]],
    [
      "a staking call after another action",
      [
        { action: "TRANSFER", method: null },
        { action: "FUNCTION_CALL", method: "stake" },
      ],
    ],
    ["a deposit and stake", [{ action: "FUNCTION_CALL", method: "deposit_and_stake" }]],
  ])("names the pool %s called, whatever the operation type", (_name, actions) => {
    const operation = toOperation(
      transaction({ receiver_account_id: "pool.poolv1.near", actions }),
      ADDRESS,
    );

    expect(operation.details).toEqual({ familyExtra: { stakingPool: "pool.poolv1.near" } });
  });

  it.each([
    ["a transfer", transaction()],
    [
      "a staking call the account did not sign",
      transaction({
        signer_account_id: PEER,
        receiver_account_id: ADDRESS,
        actions: [{ action: "FUNCTION_CALL", method: "deposit_and_stake" }],
      }),
    ],
  ])("names no pool for %s", (_name, tx) => {
    expect(toOperation(tx, ADDRESS).details).toBeUndefined();
  });

  it("maps the block reference and converts the nanosecond timestamp", () => {
    const operation = toOperation(transaction(), ADDRESS);

    expect(operation.tx.block).toEqual({
      height: 140_000_000,
      hash: "BlockHash1",
      time: new Date(1_750_000_000_000),
    });
    expect(operation.tx.date).toEqual(new Date(1_750_000_000_000));
  });

  it("tolerates a transaction with no block, fee or deposit", () => {
    const operation = toOperation(
      transaction({ block: undefined, outcomes_agg: undefined, actions_agg: undefined }),
      ADDRESS,
    );

    expect(operation.value).toBe(0n);
    expect(operation.tx.fees).toBe(0n);
    expect(operation.tx.block).toMatchObject({ height: 0, hash: "" });
  });

  it("marks a reverted transaction as failed", () => {
    expect(toOperation(transaction({ outcomes: { status: false } }), ADDRESS).tx.failed).toBe(true);
    expect(toOperation(transaction({ outcomes: undefined }), ADDRESS).tx.failed).toBe(false);
  });
});

describe("toOperation flags read by the sync", () => {
  it("flags an operation whose outcome is not indexed yet", () => {
    const operation = toOperation(transaction({ outcomes: {} }), ADDRESS);

    expect(operation.details).toEqual({ familyExtra: { outcomePending: true } });
  });

  it("does not flag an operation whose outcome is indexed", () => {
    expect(toOperation(transaction(), ADDRESS).details).toBeUndefined();
  });

  it("flags a staking call another account relayed for the address", () => {
    const operation = toOperation(
      transaction({
        signer_account_id: "relayer.near",
        receiver_account_id: ADDRESS,
        actions: [
          { action: "DELEGATE_ACTION", method: null },
          { action: "FUNCTION_CALL", method: "deposit_and_stake" },
        ],
      }),
      ADDRESS,
    );

    expect(operation.details).toEqual({ familyExtra: { relayedCall: true } });
  });

  it("does not flag a relayed call to anything but a staking pool", () => {
    const operation = toOperation(
      transaction({
        signer_account_id: "relayer.near",
        receiver_account_id: ADDRESS,
        actions: [
          { action: "DELEGATE_ACTION", method: null },
          { action: "FUNCTION_CALL", method: "claim" },
        ],
      }),
      ADDRESS,
    );

    expect(operation.details).toBeUndefined();
  });

  it("keeps the staking pool next to the other flags", () => {
    const operation = toOperation(
      transaction({
        receiver_account_id: "pool.poolv1.near",
        outcomes: {},
        actions: [{ action: "FUNCTION_CALL", method: "deposit_and_stake" }],
      }),
      ADDRESS,
    );

    expect(operation.details).toEqual({
      familyExtra: { stakingPool: "pool.poolv1.near", outcomePending: true },
    });
  });
});

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReceipts();
  });

  it("rejects ascending order, since paging runs newest first", async () => {
    await expect(
      listOperations(mockNearContext, ADDRESS, { minHeight: 0, order: "asc" }),
    ).rejects.toThrow("ascending order is not supported");
  });

  it("forwards the transactions cursor and limit to the indexer and returns a next cursor", async () => {
    mockPage([transaction()], "cursor-2");

    const page = await listOperations(mockNearContext, ADDRESS, {
      minHeight: 0,
      cursor: encode({ t: "cursor-1" }),
      limit: 10,
    });

    expect(fetchTransactionsPage).toHaveBeenCalledWith(expect.anything(), ADDRESS, {
      cursor: "cursor-1",
      limit: 10,
    });
    expect(decode(page.next).t).toBe("cursor-2");
    expect(page.items).toHaveLength(1);
  });

  it("drops operations below minHeight and stops paging once the floor is crossed", async () => {
    mockPage(
      [
        transaction({ block: { block_hash: "b2", block_height: "200" } }),
        transaction({ block: { block_hash: "b1", block_height: "100" } }),
      ],
      "cursor-2",
    );

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 150 });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].tx.block.height).toBe(200);
    expect(page.next).toBeUndefined();
  });

  // The indexer 422s outside 1..100, so an out-of-range limit must never reach it.
  it.each([
    ["above the cap", 500, 100],
    ["zero", 0, 1],
    ["negative", -5, 1],
  ])("clamps a limit %s", async (_label, limit, expected) => {
    mockPage([transaction()]);

    await listOperations(mockNearContext, ADDRESS, { minHeight: 0, limit });

    expect(fetchTransactionsPage).toHaveBeenCalledWith(expect.anything(), ADDRESS, {
      cursor: undefined,
      limit: expected,
    });
  });

  it("returns an empty page when the indexer has no data", async () => {
    mockPage([]);

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });
});

describe("listOperations receipt transfers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReceipts();
  });

  it("merges a receipt transfer into the page, newest first", async () => {
    mockPage([
      transaction({ block: { block_hash: "b2", block_height: "140000010" } }),
      transaction({
        transaction_hash: "older",
        block: { block_hash: "b1", block_height: "140000001" },
      }),
    ]);
    mockReceipts([transfer()]);

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(page.items.map(item => item.tx.block.height)).toEqual([
      140_000_010, 140_000_005, 140_000_001,
    ]);
    expect(page.items[1]).toEqual({
      id: "payout-hash",
      type: "IN",
      senders: ["intents.near"],
      recipients: [ADDRESS],
      value: 7_000_000_000_000_000_000_000_000n,
      asset: { type: "native" },
      tx: {
        hash: "payout-hash",
        block: { height: 140_000_005, hash: "ReceiptBlock", time: new Date(1_750_000_005_000) },
        fees: 0n,
        date: new Date(1_750_000_005_000),
        failed: false,
      },
    });
  });

  it("maps a receipt transfer with no block hash to an empty one", async () => {
    mockPage([transaction()]);
    mockReceipts([transfer({ blockHash: undefined })]);

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(page.items.find(item => item.id === "payout-hash")?.tx.block.hash).toBe("");
  });

  it("tells the receipts read which transactions it already holds", async () => {
    mockPage([transaction({ transaction_hash: "held" })]);

    await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(readReceiptTransfers).toHaveBeenCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ knownHashes: new Set(["held"]) }),
    );
  });

  it("returns a composite next cursor and reads on from it", async () => {
    mockPage(
      [
        transaction({ block: { block_height: "300" } }),
        transaction({ block: { block_height: "250" } }),
      ],
      "txns-2",
    );
    mockReceipts([], "receipts-2");

    const first = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(decode(first.next)).toEqual({ t: "txns-2", r: "receipts-2", u: 250 });

    await listOperations(mockNearContext, ADDRESS, { minHeight: 0, cursor: first.next });

    expect(fetchTransactionsPage).toHaveBeenLastCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ cursor: "txns-2" }),
    );
    expect(readReceiptTransfers).toHaveBeenLastCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ cursor: "receipts-2", upperHeight: 250 }),
    );
  });

  it("bounds each receipts read to a page budget, the last transaction page included", async () => {
    mockPage([transaction({ block: { block_height: "300" } })]);

    await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(readReceiptTransfers).toHaveBeenCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ floorHeight: 0, pageBudget: 10 }),
    );
  });

  it("when the budget stops the receipts read, returns only what lies above it and reads the same page on", async () => {
    mockPage(
      [
        transaction({ transaction_hash: "above", block: { block_height: "300" } }),
        transaction({ transaction_hash: "below", block: { block_height: "120" } }),
      ],
      "txns-2",
    );
    (readReceiptTransfers as jest.Mock).mockResolvedValue({
      transfers: [transfer({ blockHeight: 250 })],
      resumeCursor: "receipts-9",
      truncatedAtHeight: 200,
    });

    const page = await listOperations(mockNearContext, ADDRESS, {
      minHeight: 0,
      cursor: encode({ t: "txns-1" }),
    });

    expect(page.items.map(item => item.tx.block.height)).toEqual([300, 250]);
    expect(decode(page.next)).toEqual({ t: "txns-1", r: "receipts-9", u: 200, h: 200 });
  });

  it("re-reading a page, skips the transactions it already returned", async () => {
    mockPage(
      [
        transaction({ transaction_hash: "above", block: { block_height: "300" } }),
        transaction({ transaction_hash: "below", block: { block_height: "120" } }),
      ],
      "txns-2",
    );

    const page = await listOperations(mockNearContext, ADDRESS, {
      minHeight: 0,
      cursor: encode({ t: "txns-1", r: "receipts-9", u: 200, h: 200 }),
    });

    expect(page.items.map(item => item.id)).toEqual(["below"]);
    expect(readReceiptTransfers).toHaveBeenCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ cursor: "receipts-9", upperHeight: 200 }),
    );
    expect(decode(page.next)).toEqual({ t: "txns-2", u: 120 });
  });

  it("re-reads the first page with no transactions cursor when the budget stops its receipts read", async () => {
    mockPage([transaction({ block: { block_height: "300" } })]);
    (readReceiptTransfers as jest.Mock).mockResolvedValue({
      transfers: [],
      resumeCursor: "receipts-9",
      truncatedAtHeight: 200,
    });

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(decode(page.next)).toEqual({ r: "receipts-9", u: 200, h: 200 });
  });

  it("omits the receipts cursor when the receipts read has none to resume", async () => {
    mockPage([transaction({ block: { block_height: "300" } })], "txns-2");

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(decode(page.next)).toEqual({ t: "txns-2", u: 300 });
  });

  it("windows the receipts at the lowest height of a page that has a next one", async () => {
    mockPage(
      [
        transaction({ block: { block_height: "300" } }),
        transaction({ block: { block_height: "250" } }),
      ],
      "txns-2",
    );

    await listOperations(mockNearContext, ADDRESS, { minHeight: 100 });

    expect(readReceiptTransfers).toHaveBeenCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ floorHeight: 250 }),
    );
  });

  it("windows the receipts down to minHeight on the last page", async () => {
    mockPage([transaction({ block: { block_height: "300" } })]);

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 100 });

    expect(readReceiptTransfers).toHaveBeenCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ floorHeight: 100 }),
    );
    expect(page.next).toBeUndefined();
  });

  it("drops receipt transfers below minHeight and stops paging at the floor", async () => {
    mockPage(
      [
        transaction({ block: { block_height: "200" } }),
        transaction({ block: { block_height: "100" } }),
      ],
      "txns-2",
    );
    mockReceipts([
      transfer({ transactionHash: "kept", blockHeight: 180 }),
      transfer({ transactionHash: "dropped", blockHeight: 120 }),
    ]);

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 150 });

    expect(page.items.map(item => item.id)).toEqual([
      "GkQ7Uh8oPPGtVfyPz1yLKmqPqZ8ZyxvGtN5MmYq8mF1w",
      "kept",
    ]);
    expect(page.next).toBeUndefined();
    expect(readReceiptTransfers).toHaveBeenCalledWith(
      expect.anything(),
      ADDRESS,
      expect.objectContaining({ floorHeight: 150 }),
    );
  });

  it.each([
    ["not base64url json", "!!!"],
    ["not an object", Buffer.from("42").toString("base64url")],
    ["a wrong field type", encode({ t: 5 })],
  ])("rejects a cursor that is %s", async (_name, cursor) => {
    await expect(
      listOperations(mockNearContext, ADDRESS, { minHeight: 0, cursor }),
    ).rejects.toThrow("invalid cursor");
  });
});
