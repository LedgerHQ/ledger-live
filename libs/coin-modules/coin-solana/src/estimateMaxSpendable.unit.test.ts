import type { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateMaxSpendableCacheKey } from "./bridge/bridge";
import { estimateMaxSpendableWithAPI } from "./estimateMaxSpendable";
import type { ChainAPI } from "./network";
import type { SolanaAccount, Transaction } from "./types";

const TX_FEE = 5000;

jest.mock("./logic/estimateFees", () => ({
  estimateTxFee: jest.fn().mockResolvedValue(5000),
}));

const api = {} as ChainAPI;

function makeOp(partial: Partial<Operation>): Operation {
  return {
    id: "op-id",
    hash: "op-hash",
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: "acc-id",
    date: new Date(),
    extra: {},
    ...partial,
  } as Operation;
}

function makeAccount(partial: Partial<SolanaAccount>): SolanaAccount {
  return {
    type: "Account",
    id: "acc-id",
    freshAddress: "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM",
    balance: new BigNumber(1_000_000),
    spendableBalance: new BigNumber(1_000_000),
    pendingOperations: [],
    ...partial,
  } as SolanaAccount;
}

describe("estimateMaxSpendableWithAPI - pending outflow subtraction", () => {
  it("returns spendableBalance minus fee when there are no pending operations", async () => {
    const account = makeAccount({ spendableBalance: new BigNumber(1_000_000) });

    const max = await estimateMaxSpendableWithAPI({ account }, api);

    expect(max.toNumber()).toBe(1_000_000 - TX_FEE);
  });

  it("subtracts a pending OUT operation (value already includes fees)", async () => {
    const account = makeAccount({
      spendableBalance: new BigNumber(1_000_000),
      pendingOperations: [makeOp({ type: "OUT", value: new BigNumber(300_000), hash: "out-1" })],
    });

    const max = await estimateMaxSpendableWithAPI({ account }, api);

    expect(max.toNumber()).toBe(1_000_000 - TX_FEE - 300_000);
  });

  it("ignores incoming pending operations", async () => {
    const account = makeAccount({
      spendableBalance: new BigNumber(1_000_000),
      pendingOperations: [makeOp({ type: "IN", value: new BigNumber(500_000), hash: "in-1" })],
    });

    const max = await estimateMaxSpendableWithAPI({ account }, api);

    expect(max.toNumber()).toBe(1_000_000 - TX_FEE);
  });

  it("sums multiple pending outflows and ignores incoming ones", async () => {
    const account = makeAccount({
      spendableBalance: new BigNumber(1_000_000),
      pendingOperations: [
        makeOp({ type: "OUT", value: new BigNumber(200_000), hash: "out-1" }),
        makeOp({ type: "OUT", value: new BigNumber(100_000), hash: "out-2" }),
        makeOp({ type: "IN", value: new BigNumber(999_999), hash: "in-1" }),
      ],
    });

    const max = await estimateMaxSpendableWithAPI({ account }, api);

    expect(max.toNumber()).toBe(1_000_000 - TX_FEE - 300_000);
  });

  it("only subtracts the SOL fee of a pending token send (FEES op value is the token amount)", async () => {
    const account = makeAccount({
      spendableBalance: new BigNumber(1_000_000),
      // A pending token transfer sets the parent FEES op value to the token amount; only the
      // SOL fee actually leaves the main account.
      pendingOperations: [
        makeOp({
          type: "FEES",
          value: new BigNumber(750_000),
          fee: new BigNumber(TX_FEE),
          hash: "fees-1",
        }),
      ],
    });

    const max = await estimateMaxSpendableWithAPI({ account }, api);

    expect(max.toNumber()).toBe(1_000_000 - TX_FEE - TX_FEE);
  });

  it("floors the result at 0 when pending outflows exceed the balance", async () => {
    const account = makeAccount({
      spendableBalance: new BigNumber(100_000),
      pendingOperations: [makeOp({ type: "OUT", value: new BigNumber(1_000_000), hash: "out-1" })],
    });

    const max = await estimateMaxSpendableWithAPI({ account }, api);

    expect(max.toNumber()).toBe(0);
  });
});

describe("estimateMaxSpendableCacheKey", () => {
  const transaction = { model: { kind: "transfer" } } as Transaction;

  it("produces the same key for identical account state", () => {
    const account = makeAccount({});

    expect(estimateMaxSpendableCacheKey({ account, transaction })).toBe(
      estimateMaxSpendableCacheKey({ account: makeAccount({}), transaction }),
    );
  });

  it("busts the cache when a pending operation appears", () => {
    const before = makeAccount({ pendingOperations: [] });
    const after = makeAccount({
      pendingOperations: [makeOp({ type: "OUT", value: new BigNumber(300_000), hash: "out-1" })],
    });

    expect(estimateMaxSpendableCacheKey({ account: before, transaction })).not.toBe(
      estimateMaxSpendableCacheKey({ account: after, transaction }),
    );
  });

  it("busts the cache when the pending operation set changes", () => {
    const one = makeAccount({
      pendingOperations: [makeOp({ hash: "out-1" })],
    });
    const two = makeAccount({
      pendingOperations: [makeOp({ hash: "out-2" })],
    });

    expect(estimateMaxSpendableCacheKey({ account: one, transaction })).not.toBe(
      estimateMaxSpendableCacheKey({ account: two, transaction }),
    );
  });

  it("does not throw when pendingOperations is undefined", () => {
    const account = makeAccount({ pendingOperations: undefined as unknown as Operation[] });

    expect(() => estimateMaxSpendableCacheKey({ account, transaction })).not.toThrow();
  });

  it("resolves the main account's pending ops for a token account", () => {
    const parentAccount = makeAccount({
      pendingOperations: [makeOp({ type: "OUT", value: new BigNumber(300_000), hash: "out-1" })],
    }) as Account;
    const tokenAccount = {
      type: "TokenAccount",
      id: "token-acc-id",
      spendableBalance: new BigNumber(42),
    } as unknown as Parameters<typeof estimateMaxSpendableCacheKey>[0]["account"];

    const key = estimateMaxSpendableCacheKey({ account: tokenAccount, parentAccount, transaction });

    expect(key).toContain("out-1");
    expect(key).toContain("token-acc-id");
  });
});
