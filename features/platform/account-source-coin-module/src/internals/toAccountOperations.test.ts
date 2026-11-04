import { AccountDataNotServedError } from "@domain/api-account-data";
import type { CoinModuleOperation, CoinModuleOperationsApi } from "../host";
import { listedOperationsOf, toAccountOperations } from "./toAccountOperations";

const SUBJECT = "0xabc";
const USDT = "ethereum/erc20/usd_tether__erc20_";
const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const USDT_ASSET = { type: "erc20", assetReference: USDT_CONTRACT };

type OperationInput = Partial<Omit<CoinModuleOperation, "tx">> & {
  hash?: string;
  date?: string;
  fees?: bigint;
  feesPayer?: string;
  failed?: boolean;
};

const operation = ({
  hash = "0xhash",
  date = "2026-01-01T00:00:00.000Z",
  fees = 0n,
  feesPayer,
  failed = false,
  ...overrides
}: OperationInput = {}): CoinModuleOperation => ({
  id: `${hash}-OUT`,
  type: "OUT",
  senders: [SUBJECT],
  recipients: ["0xdef"],
  value: 10n,
  asset: { type: "native" },
  tx: { hash, block: { height: 100 }, fees, feesPayer, date: new Date(date), failed },
  ...overrides,
});

/** A token transfer as coin-evm lists it: the fees-only native operation of its transaction left out. */
const tokenTransfer = (overrides: OperationInput = {}) =>
  operation({
    id: "0xhash-erc20-0-OUT",
    asset: USDT_ASSET,
    value: 7n,
    details: { parentSenders: [SUBJECT], parentRecipients: [USDT_CONTRACT] },
    ...overrides,
  });

const api: CoinModuleOperationsApi = {
  listOperations: async () => ({ items: [] }),
  getTokenId: async asset =>
    "assetReference" in asset && asset.assetReference === USDT_CONTRACT ? USDT : undefined,
};

const map = async (
  items: CoinModuleOperation[],
  { blacklist = [], tokens = api }: { blacklist?: string[]; tokens?: CoinModuleOperationsApi } = {},
) =>
  toAccountOperations(
    "ethereum",
    SUBJECT,
    await listedOperationsOf("ethereum", items, tokens, new Set(blacklist)),
  );

describe("toAccountOperations", () => {
  it("maps a native operation, counting the fees the account paid in its value", async () => {
    const operations = await map([operation({ fees: 2n })]);

    expect(operations).toEqual([
      {
        id: "ethereum-0xhash-OUT",
        hash: "0xhash",
        type: "OUT",
        assetId: "ethereum",
        value: "12",
        fee: "2",
        senders: [SUBJECT],
        recipients: ["0xdef"],
        blockHeight: 100,
        date: "2026-01-01T00:00:00.000Z",
        hasFailed: false,
      },
    ]);
  });

  it("does not count the fees in a received value", async () => {
    const operations = await map([operation({ type: "IN", id: "in", fees: 2n })]);

    expect(operations[0]).toMatchObject({ value: "10", fee: "2" });
  });

  it("values a failed transaction at its fees, never below zero", async () => {
    const operations = await map([
      operation({ id: "failed", fees: 3n, failed: true }),
      operation({ id: "refund", hash: "0xother", type: "IN", value: -5n }),
    ]);

    expect(operations.map(({ value, fee }) => ({ value, fee }))).toEqual([
      { value: "3", fee: "3" },
      { value: "0", fee: "0" },
    ]);
  });

  it("gives a token transfer the account paid the gas of a FEES parent carrying it", async () => {
    const operations = await map([tokenTransfer({ fees: 2n, feesPayer: "0xABC" })]);

    expect(operations).toEqual([
      {
        id: "ethereum-0xhash-FEES",
        hash: "0xhash",
        type: "FEES",
        assetId: "ethereum",
        value: "2",
        fee: "2",
        senders: [SUBJECT],
        recipients: [USDT_CONTRACT],
        blockHeight: 100,
        date: "2026-01-01T00:00:00.000Z",
        hasFailed: false,
      },
      expect.objectContaining({
        id: `${USDT}-0xhash-erc20-0-OUT`,
        assetId: USDT,
        value: "7",
        fee: "0",
        parentId: "ethereum-0xhash-FEES",
      }),
    ]);
  });

  it("gives a token transfer the account did not pay the gas of no parent", async () => {
    const operations = await map([
      tokenTransfer({ type: "IN", fees: 2n, feesPayer: "0xdef" }),
      tokenTransfer({ id: "0xother-erc20-0-IN", hash: "0xother", type: "IN", fees: 2n }),
    ]);

    expect(operations.map(({ assetId, parentId }) => ({ assetId, parentId }))).toEqual([
      { assetId: USDT, parentId: undefined },
      { assetId: USDT, parentId: undefined },
    ]);
  });

  it("puts a token operation after its transaction's native one, pointing at it, fees left to the parent", async () => {
    const operations = await map([
      tokenTransfer({ fees: 2n, feesPayer: SUBJECT }),
      operation({ value: 5n, fees: 2n, feesPayer: SUBJECT }),
    ]);

    expect(operations).toMatchObject([
      { id: "ethereum-0xhash-OUT", assetId: "ethereum", value: "7", fee: "2" },
      { assetId: USDT, value: "7", fee: "0", parentId: "ethereum-0xhash-OUT" },
    ]);
  });

  it("points an internal operation at its transaction's native one", async () => {
    const operations = await map([
      operation({ id: "internal", type: "IN", details: { internal: true }, fees: 2n }),
      operation({ fees: 2n }),
    ]);

    expect(operations).toMatchObject([
      { id: "ethereum-0xhash-OUT", fee: "2" },
      { id: "ethereum-internal", value: "10", fee: "0", parentId: "ethereum-0xhash-OUT" },
    ]);
  });

  it("orders the transactions newest first", async () => {
    const operations = await map([
      operation({ id: "old", hash: "0x1", date: "2026-01-01T00:00:00.000Z" }),
      operation({ id: "new", hash: "0x2", date: "2026-03-01T00:00:00.000Z" }),
    ]);

    expect(operations.map(({ id }) => id)).toEqual(["ethereum-new", "ethereum-old"]);
  });

  it("leaves out NFT transfers, failed transfers received, unlisted and blacklisted tokens", async () => {
    const operations = await map(
      [
        operation({ id: "kept" }),
        operation({ id: "nft", type: "NFT_IN", details: { ledgerOpType: "NFT_IN" } }),
        operation({ id: "failed-in", type: "IN", failed: true }),
        operation({ id: "unlisted", asset: { type: "erc20", assetReference: "0xunknown" } }),
        operation({ id: "spam", asset: USDT_ASSET }),
      ],
      { blacklist: [USDT] },
    );

    expect(operations.map(({ id }) => id)).toEqual(["ethereum-kept"]);
  });

  it("leaves out an operation the entity cannot hold, and a repeated one", async () => {
    const operations = await map([
      operation({ id: "kept" }),
      operation({ id: "unknown", type: "SWAP" }),
      operation({ id: "kept" }),
    ]);

    expect(operations.map(({ id }) => id)).toEqual(["ethereum-kept"]);
  });

  it("is not served when the module lists tokens with no resolver to name them", async () => {
    const tokens = { listOperations: api.listOperations };

    await expect(map([operation()], { tokens })).resolves.toMatchObject([{ assetId: "ethereum" }]);
    await expect(map([tokenTransfer()], { tokens })).rejects.toBeInstanceOf(
      AccountDataNotServedError,
    );
  });
});
