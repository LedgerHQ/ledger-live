import BigNumber from "bignumber.js";
import { mapTxToOps } from "../bridge/bridgeHelpers/account";
import { fetchTxnsPage } from "../network/api";
import type { Operation, TransactionWithId } from "../network/idl/index.types";
import { getBlockInfo } from "./getBlockInfo";
import { indexedTime, listOperations, toOperations } from "./listOperations";

jest.mock("../network/api", () => ({ fetchTxnsPage: jest.fn() }));
jest.mock("./getBlockInfo", () => ({ getBlockInfo: jest.fn() }));

const mockFetchTxnsPage = jest.mocked(fetchTxnsPage);
const mockGetBlockInfo = jest.mocked(getBlockInfo);

const DATE = new Date(1750760223449);

const ME = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const OTHER = "5442dcadb1de34824e0a3000db6228ab21f3ad298caa1d910da0bd56d7f892a5";

const transfer = (from: string, to: string, amount = 100_000_000n): Operation => ({
  Transfer: { from, to, amount: { e8s: amount }, fee: { e8s: 10_000n }, spender: [] },
});

const tx = (id: bigint, operation: Operation, memo = 0n): TransactionWithId => ({
  id,
  transaction: {
    memo,
    icrc1_memo: [],
    operation,
    timestamp: [{ timestamp_nanos: 1_750_760_223_449_601_159n }],
    created_at_time: [{ timestamp_nanos: 1_750_760_220_000_000_000n }],
  },
});

afterEach(() => jest.resetAllMocks());

describe("toOperations", () => {
  it("maps an outgoing transfer to OUT carrying the amount alone", () => {
    const [op] = toOperations(tx(42n, transfer(ME, OTHER), 7n), ME, DATE);
    expect(op).toMatchObject({
      type: "OUT",
      senders: [ME],
      recipients: [OTHER],
      value: 100_000_000n,
      asset: { type: "native" },
      memo: { type: "string", kind: "memo", value: "7" },
      details: { memo: "7" },
      tx: {
        block: { height: 42, hash: "", time: new Date(1750760223449) },
        fees: 10_000n,
        feesPayer: ME,
        date: new Date(1750760223449),
        failed: false,
      },
    });
    expect(op.id).toBe(`${op.tx.hash}-OUT`);
  });

  it("maps an incoming transfer to IN", () => {
    expect(toOperations(tx(42n, transfer(OTHER, ME)), ME, DATE).map(op => op.type)).toEqual(["IN"]);
  });

  it("maps a transfer to itself to both OUT and IN, with distinct ids", () => {
    const ops = toOperations(tx(42n, transfer(ME, ME)), ME, DATE);
    expect(ops.map(op => op.type)).toEqual(["OUT", "IN"]);
    expect(new Set(ops.map(op => op.id)).size).toBe(2);
  });

  it.each([
    ["mint", { Mint: { to: ME, amount: { e8s: 1n } } }],
    ["burn", { Burn: { from: ME, amount: { e8s: 1n }, spender: [] } }],
  ] as [string, Operation][])("yields nothing for a %s", (_, operation) => {
    expect(toOperations(tx(1n, operation), ME, DATE)).toEqual([]);
  });

  it("matches the address in either case", () => {
    expect(toOperations(tx(1n, transfer(ME, OTHER)), ME.toUpperCase(), DATE)).toHaveLength(1);
  });

  // The account bridge reports an OUT value with the fee folded in; the generic framework folds
  // it in from `tx.fees` instead. Everything else must agree.
  it.each([
    ["outgoing", transfer(ME, OTHER)],
    ["incoming", transfer(OTHER, ME)],
  ])("agrees with the account bridge on an %s transfer", (_, operation) => {
    const txInfo = tx(42n, operation, 123n);
    const legacy = mapTxToOps("accountId", ME)(txInfo);
    const ops = toOperations(txInfo, ME, DATE);

    expect(ops.map(op => op.type)).toEqual(legacy.map(op => op.type));
    ops.forEach((op, i) => {
      const old = legacy[i];
      expect(op.tx.hash).toBe(old.hash);
      expect(op.tx.block.height).toBe(old.blockHeight);
      expect(op.tx.date).toEqual(old.date);
      expect(op.senders).toEqual(old.senders);
      expect(op.recipients).toEqual(old.recipients);
      expect(op.memo).toEqual({ type: "string", kind: "memo", value: old.extra.memo });
      expect(new BigNumber(op.tx.fees.toString())).toEqual(old.fee);
      const value = new BigNumber(op.value.toString());
      expect(op.type === "OUT" ? value.plus(old.fee) : value).toEqual(old.value);
    });
  });

  // Intended difference: the account bridge types both legs of a transfer to itself OUT under one
  // id, so the merge keeps a single OUT that also counts the amount as spent. OUT plus IN nets to
  // the fee, which is what the balance actually loses.
  it("splits a transfer to itself where the account bridge collapses it", () => {
    const txInfo = tx(42n, transfer(ME, ME));
    const legacy = mapTxToOps("accountId", ME)(txInfo);

    expect(legacy.map(op => op.type)).toEqual(["OUT", "OUT"]);
    expect(legacy[0].id).toBe(legacy[1].id);
    expect(toOperations(txInfo, ME, DATE).map(op => op.type)).toEqual(["OUT", "IN"]);
  });
});

describe("indexedTime", () => {
  it("prefers the block time", () => {
    expect(indexedTime(tx(1n, transfer(ME, OTHER)))).toEqual(new Date(1750760223449));
  });

  it("falls back to the creation time", () => {
    const txInfo = tx(1n, transfer(ME, OTHER));
    txInfo.transaction.timestamp = [];
    expect(indexedTime(txInfo)).toEqual(new Date(1750760220000));
  });

  it("gives nothing when neither is known", () => {
    const txInfo = tx(1n, transfer(ME, OTHER));
    txInfo.transaction.timestamp = [];
    txInfo.transaction.created_at_time = [];
    expect(indexedTime(txInfo)).toBeUndefined();
  });
});

describe("listOperations", () => {
  it("dates a transaction the index gives no time for by its block", async () => {
    const txInfo = tx(30n, transfer(OTHER, ME));
    txInfo.transaction.timestamp = [];
    txInfo.transaction.created_at_time = [];
    mockFetchTxnsPage.mockResolvedValue({ transactions: [txInfo], oldestTxId: 30n });
    mockGetBlockInfo.mockResolvedValue({ height: 30, hash: "h", time: new Date(5) });

    const { items } = await listOperations(ME, { minHeight: 0 });

    expect(mockGetBlockInfo).toHaveBeenCalledWith(30);
    expect(items[0].tx.date).toEqual(new Date(5));
  });

  it("queries the index with the lowercase address", async () => {
    mockFetchTxnsPage.mockResolvedValue({ transactions: [], oldestTxId: undefined });

    await listOperations(ME.toUpperCase(), { minHeight: 0 });

    expect(mockFetchTxnsPage).toHaveBeenCalledWith(ME, undefined, 100);
  });

  it("returns the page newest first with the last id as cursor", async () => {
    mockFetchTxnsPage.mockResolvedValue({
      transactions: [tx(30n, transfer(OTHER, ME)), tx(20n, transfer(ME, OTHER))],
      oldestTxId: 10n,
    });

    const page = await listOperations(ME, { minHeight: 0 });

    expect(mockFetchTxnsPage).toHaveBeenCalledWith(ME, undefined, 100);
    expect(page.items.map(op => op.tx.block.height)).toEqual([30, 20]);
    expect(page.next).toBe("20");
  });

  it("resumes after the cursor and clamps the limit to one index query", async () => {
    mockFetchTxnsPage.mockResolvedValue({ transactions: [], oldestTxId: 10n });

    await listOperations(ME, { minHeight: 0, cursor: "20", limit: 5000 });

    expect(mockFetchTxnsPage).toHaveBeenCalledWith(ME, 20n, 100);
  });

  it("ends the stream on the account's oldest transaction", async () => {
    mockFetchTxnsPage.mockResolvedValue({
      transactions: [tx(20n, transfer(ME, OTHER)), tx(10n, transfer(OTHER, ME))],
      oldestTxId: 10n,
    });

    expect((await listOperations(ME, { minHeight: 0 })).next).toBeUndefined();
  });

  it("ends the stream on an empty page", async () => {
    mockFetchTxnsPage.mockResolvedValue({ transactions: [], oldestTxId: undefined });

    expect(await listOperations(ME, { minHeight: 0 })).toEqual({ items: [], next: undefined });
  });

  it("keeps operations at minHeight and stops below it", async () => {
    mockFetchTxnsPage.mockResolvedValue({
      transactions: [
        tx(30n, transfer(OTHER, ME)),
        tx(20n, transfer(OTHER, ME)),
        tx(10n, transfer(OTHER, ME)),
      ],
      oldestTxId: 1n,
    });

    const page = await listOperations(ME, { minHeight: 20 });

    expect(page.items.map(op => op.tx.block.height)).toEqual([30, 20]);
    expect(page.next).toBeUndefined();
  });

  it("keeps an advancing cursor when a page holds no operation for the address", async () => {
    mockFetchTxnsPage.mockResolvedValue({
      transactions: [tx(30n, { Mint: { to: ME, amount: { e8s: 1n } } })],
      oldestTxId: 1n,
    });

    expect(await listOperations(ME, { minHeight: 0 })).toEqual({ items: [], next: "30" });
  });

  it("refuses ascending order", async () => {
    await expect(listOperations(ME, { minHeight: 0, order: "asc" })).rejects.toThrow(
      /ascending order is not supported/,
    );
  });

  it("refuses a cursor that is not a transaction id", async () => {
    await expect(listOperations(ME, { minHeight: 0, cursor: "abc" })).rejects.toThrow(
      /Invalid cursor/,
    );
    expect(mockFetchTxnsPage).not.toHaveBeenCalled();
  });
});
