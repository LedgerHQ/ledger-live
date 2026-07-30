import { fetchTransactionsPage } from "../../network";
import type { NearTransaction } from "../../network/sdk.types";
import { listOperations, toOperation } from "./listOperations";

jest.mock("../../network", () => ({ fetchTransactionsPage: jest.fn() }));

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

describe("listOperations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects ascending order, since paging runs newest first", async () => {
    await expect(listOperations(ADDRESS, { minHeight: 0, order: "asc" })).rejects.toThrow(
      "ascending order is not supported",
    );
  });

  it("forwards the cursor and limit to the indexer and returns its next cursor", async () => {
    mockPage([transaction()], "cursor-2");

    const page = await listOperations(ADDRESS, { minHeight: 0, cursor: "cursor-1", limit: 10 });

    expect(fetchTransactionsPage).toHaveBeenCalledWith(ADDRESS, {
      cursor: "cursor-1",
      limit: 10,
    });
    expect(page.next).toBe("cursor-2");
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

    const page = await listOperations(ADDRESS, { minHeight: 150 });

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

    await listOperations(ADDRESS, { minHeight: 0, limit });

    expect(fetchTransactionsPage).toHaveBeenCalledWith(ADDRESS, {
      cursor: undefined,
      limit: expected,
    });
  });

  it("returns an empty page when the indexer has no data", async () => {
    mockPage([]);

    const page = await listOperations(ADDRESS, { minHeight: 0 });

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });
});
