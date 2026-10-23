import type { Operation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { Address, Cell } from "@ton/core";
import { keyPairFromSeed, sign } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { randomBytes } from "crypto";
import { createMockTonContext, mockTonConfig } from "../test/context";
import {
  NOT_MASTER,
  OWNER,
  OWNER_JETTON_WALLET_RAW,
  PEER_RAW,
  jettonIn,
  jettonOut,
  jettonSendTx,
} from "../test/history.fixtures";
import { decodeTransferBody } from "../test/transferBody";
import type { TonMemo } from "../types";
import { createApi } from "./index";

const sendIntent = (
  overrides: Partial<TransactionIntent<TonMemo>> = {},
): TransactionIntent<TonMemo> =>
  ({
    intentType: "transaction",
    type: "send",
    sender: OWNER,
    recipient: PEER_RAW,
    amount: 10_000_000n,
    asset: { type: "native" },
    memo: { type: "string", kind: "comment", value: "integration" },
    ...overrides,
  }) as TransactionIntent<TonMemo>;

// A DEX vault with thousands of transfers a day; its 2026-10 history is immutable, so an ascending
// walk from a fixed cursor reads the same rows every run.
const BUSY = "0:0D110E78ADB1800F6455741051C531BBE1EE4620E5381DE44A5DBC9BC54F9AB5";
const BUSY_FROM = "1792400000";

// The endpoint now and then answers `{"error":"timeout"}` after 3 s, on reads and writes alike.
jest.retryTimes(2, { logErrorsBeforeRetry: true });

describe("TON api (mainnet)", () => {
  const api = createApi();
  const context = createMockTonContext({
    ...mockTonConfig,
    infra: { API_TON_ENDPOINT: "https://ton.coin.ledger.com/api/v3", KNOWN_JETTONS: [] },
  });

  const walk = async (
    address: string,
    options: { minHeight: number; limit?: number; order?: "asc" | "desc"; cursor?: string },
    maxPages = Infinity,
  ): Promise<Operation[]> => {
    const items: Operation[] = [];
    let cursor = options.cursor;
    for (let page = 0; page < maxPages; page++) {
      const result = await api.listOperations(context, address, { ...options, cursor });
      items.push(...result.items);
      if (!result.next) break;
      cursor = result.next;
    }
    return items;
  };

  it("reports the tip as the block at its own height", async () => {
    const tip = await api.lastBlock(context);

    await expect(api.getBlockInfo(context, tip.height)).resolves.toEqual(tip);
  });

  it("reports the native balance and the NOT jetton", async () => {
    const balances = await api.getBalance(context, OWNER);

    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances).toContainEqual({
      value: expect.any(BigInt),
      asset: { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER },
    });
  });

  it("reads the wallet's seqno", async () => {
    expect(await api.getNextSequence(context, OWNER)).toBeGreaterThanOrEqual(3n);
  });

  it("lists the native and jetton legs of a jetton send under one hash", async () => {
    const operations = await walk(OWNER, { minHeight: 0 });

    expect(operations).toContainEqual(
      expect.objectContaining({
        type: "OUT",
        asset: { type: "native" },
        value: 100000000n,
        tx: expect.objectContaining({ hash: jettonSendTx.in_msg.hash, fees: 2600565n + 535471n }),
      }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({
        type: "OUT",
        asset: { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER },
        value: BigInt(jettonOut.amount),
        tx: expect.objectContaining({
          hash: jettonSendTx.in_msg.hash,
          block: expect.objectContaining({ height: 40170319 }),
        }),
      }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({
        type: "IN",
        value: BigInt(jettonIn.amount),
        tx: expect.objectContaining({
          hash: jettonIn.transaction_hash,
          block: expect.objectContaining({ height: 40170273 }),
        }),
      }),
    );
  });

  it("resumes from minHeight without dropping what landed from it on", async () => {
    const all = await walk(OWNER, { minHeight: 0 });
    const resumed = await walk(OWNER, { minHeight: 40170319 });

    expect(resumed.map(op => op.id).sort()).toEqual(
      all
        .filter(op => op.tx.block.height >= 40170319)
        .map(op => op.id)
        .sort(),
    );
    expect(resumed.length).toBeGreaterThan(0);
  });

  it("pages through a busy account as one large page would", async () => {
    const paged = await walk(BUSY, { minHeight: 0, order: "asc", limit: 20, cursor: BUSY_FROM }, 4);
    const single = await walk(
      BUSY,
      { minHeight: 0, order: "asc", limit: 200, cursor: BUSY_FROM },
      1,
    );
    const until = paged[paged.length - 1].tx.date.getTime();
    const ids = (operations: Operation[]) =>
      operations
        .filter(op => op.tx.date.getTime() < until)
        .map(op => op.id)
        .sort();

    expect(ids(paged).length).toBeGreaterThan(20);
    expect(paged.some(op => op.asset.type === "jetton")).toBe(true);
    expect(ids(paged)).toEqual(ids(single));
  });

  it("validates a transfer against the live balances", async () => {
    const balances = await api.getBalance(context, OWNER);

    const { errors, estimatedFees } = await api.validateIntent(context, sendIntent(), balances);

    expect(errors).toEqual({});
    expect(estimatedFees).toBeGreaterThan(0n);
  });

  it("prices a native transfer from the wallet's current seqno", async () => {
    const { value } = await api.estimateFees(context, sendIntent());

    expect(value).toBeGreaterThan(0n);
    expect(value).toBeLessThan(100_000_000n);
  });

  it("prices the first transfer of an undeployed wallet with its deployment", async () => {
    const { publicKey } = keyPairFromSeed(randomBytes(32));
    const sender = WalletContractV4.create({ workchain: 0, publicKey }).address.toString({
      urlSafe: true,
      bounceable: false,
    });

    const { value } = await api.estimateFees(
      context,
      sendIntent({ sender, senderPublicKey: publicKey.toString("hex") }),
    );

    expect(value).toBeGreaterThan(0n);
  });

  it("crafts a NOT transfer through the sender's jetton wallet", async () => {
    const { transaction } = await api.craftTransaction(
      context,
      sendIntent({
        asset: { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER },
        amount: 1n,
      }),
    );

    expect(decodeTransferBody(transaction).to).toEqual(Address.parse(OWNER_JETTON_WALLET_RAW));
  });

  it("has the node reject a transfer from an empty wallet", async () => {
    const keys = keyPairFromSeed(randomBytes(32));
    const sender = WalletContractV4.create({
      workchain: 0,
      publicKey: keys.publicKey,
    }).address.toString({ urlSafe: true, bounceable: false });
    const { transaction } = await api.craftTransaction(context, sendIntent({ sender }));
    expect(decodeTransferBody(transaction).seqno).toBe(0);

    const signature = sign(Cell.fromBase64(transaction).hash(), keys.secretKey);
    const signed = await api.combine(context, transaction, [signature.toString("hex")], {
      pubkey: keys.publicKey.toString("hex"),
    });

    await expect(api.broadcast(context, signed)).rejects.toThrow(
      /Failed to unpack account state|external import fees exceed account balance|cannot apply external message/,
    );
  });
});
