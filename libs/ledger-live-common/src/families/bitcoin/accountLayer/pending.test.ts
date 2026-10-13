import { BigNumber } from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import { decorateOptimisticOperation } from "./pending";
import { bitcoinAccountLayer } from "./index";

// the multi-address engine settles by hash; the bitcoin hooks settle replaced sends and keep the
// entered recipient
const postSync = bitcoinAccountLayer.postSync;

const op = (overrides: Partial<Operation>): Operation =>
  ({
    id: `${overrides.hash}-${overrides.type ?? "OUT"}`,
    type: "OUT",
    recipients: [],
    extra: {},
    blockHeight: 10,
    ...overrides,
  }) as Operation;

const account = (operations: Operation[], pendingOperations: Operation[]) =>
  ({ operations, pendingOperations }) as unknown as Account;

describe("postSync", () => {
  it("leaves an account without pending operations alone", () => {
    const synced = account([op({ hash: "a" })], []);
    expect(postSync(synced, synced)).toBe(synced);
  });

  it("settles a pending operation once its transaction is confirmed, keeping the entered recipient", () => {
    const pending = op({ hash: "sent", blockHeight: null, recipients: ["entered"] });
    const noRecipient = op({ hash: "psbt", blockHeight: null, recipients: [] });
    const synced = account(
      [
        op({ hash: "sent", recipients: ["from-chain"] }),
        op({ hash: "sent", type: "IN", recipients: ["mine"] }),
        op({ hash: "psbt", recipients: ["chain"] }),
        op({ hash: "other", recipients: ["x"] }),
      ],
      [pending, noRecipient],
    );
    const result = postSync(synced, synced);
    expect(result.pendingOperations).toEqual([]);
    expect(result.operations.map(o => o.recipients)).toEqual([
      ["entered"],
      ["mine"],
      ["chain"],
      ["x"],
    ]);
  });

  it("settles a pending operation whose input another confirmed transaction spends", () => {
    const replaced = op({ hash: "replaced", blockHeight: null, extra: { inputs: ["u-0"] } });
    const waiting = op({ hash: "waiting", blockHeight: null, extra: { inputs: ["v-0"] } });
    const synced = account(
      [
        op({ hash: "replacement", extra: { inputs: ["u-0"] } }),
        op({ hash: "still-pending", blockHeight: null, extra: { inputs: ["v-0"] } }),
        op({ hash: "no-extra", extra: undefined }),
      ],
      [replaced, waiting],
    );
    expect(postSync(synced, synced).pendingOperations).toEqual([waiting]);
  });

  it("keeps a pending operation while what spends its inputs is unconfirmed", () => {
    const self = op({
      hash: "self",
      blockHeight: null,
      extra: { inputs: ["w-0"] },
      recipients: [],
    });
    const synced = account(
      [op({ hash: "x", blockHeight: undefined, extra: { inputs: ["w-0"] } })],
      [self],
    );
    expect(postSync(synced, synced).pendingOperations).toEqual([self]);
  });
});

describe("decorateOptimisticOperation", () => {
  const envelope = (sequence: number) => JSON.stringify({ inputs: [{ sequence }] });
  const details = {
    inputs: ["a-0"],
    inputRefs: [{ hash: "a", outputIndex: 0, address: "me" }],
    fee: 150n,
    amount: 1_000n,
    senders: ["me"],
    recipients: ["them"],
  };
  const base = op({
    hash: "",
    blockHeight: null,
    value: new BigNumber(1),
    fee: new BigNumber(0),
    senders: ["fresh"],
    recipients: ["typed"],
    transactionRaw: {
      family: "bitcoin",
      amount: "1",
      recipient: "typed",
      familySpecificData: { replaceTxId: "r" },
    } as never,
    extra: { ledgerOpType: "OUT" },
  });

  it("takes the crafted inputs, senders, recipients, fee and replaceability", () => {
    const decorated = decorateOptimisticOperation(
      base,
      { transaction: envelope(0), details },
      {} as Account,
      { recipient: "typed" },
    );
    expect(decorated).toMatchObject({
      fee: new BigNumber(150),
      value: new BigNumber(1_150),
      senders: ["me"],
      recipients: ["them"],
      extra: { ledgerOpType: "OUT", inputs: ["a-0"], inputRefs: details.inputRefs },
    });
    expect(
      (decorated.transactionRaw as never as { familySpecificData: unknown }).familySpecificData,
    ).toEqual({
      replaceTxId: "r",
      rbf: true,
    });
  });

  it("falls back on the typed recipient and says when the transaction is final", () => {
    const decorated = decorateOptimisticOperation(
      { ...base, transactionRaw: undefined },
      { transaction: envelope(0xffffffff), details: { ...details, recipients: [] } },
      {} as Account,
      { recipient: "typed" },
    );
    expect(decorated.recipients).toEqual(["typed"]);
    expect(decorated.transactionRaw).toBeUndefined();

    const withRaw = decorateOptimisticOperation(
      { ...base, transactionRaw: { family: "bitcoin", amount: "1", recipient: "typed" } as never },
      { transaction: envelope(0xffffffff), details },
      {} as Account,
      {},
    );
    expect(
      (withRaw.transactionRaw as never as { familySpecificData: unknown }).familySpecificData,
    ).toEqual({
      rbf: false,
    });
  });

  it("records the rate signed, not a custom one left over from before a preset was picked", () => {
    const withStaleRate = {
      ...base,
      transactionRaw: {
        family: "bitcoin",
        amount: "1",
        recipient: "typed",
        feesStrategy: "fast",
        familySpecificData: { feePerByte: "50", replaceTxId: "r" },
      } as never,
    };
    const signedAt = (transaction: Record<string, unknown>) =>
      (
        decorateOptimisticOperation(
          withStaleRate,
          { transaction: envelope(0), details },
          {} as Account,
          transaction,
        ).transactionRaw as never as { familySpecificData: unknown }
      ).familySpecificData;

    expect(signedAt({ feesStrategy: "fast", feeParameters: { feePerByte: "7" } })).toEqual({
      feePerByte: "7",
      replaceTxId: "r",
      rbf: true,
    });
    expect(signedAt({ feesStrategy: "custom", familySpecificData: { feePerByte: "9" } })).toEqual({
      feePerByte: "9",
      replaceTxId: "r",
      rbf: true,
    });
    expect(signedAt({})).toEqual({ replaceTxId: "r", rbf: true });
  });

  it("leaves the operation as is without crafted details", () => {
    expect(decorateOptimisticOperation(base, { transaction: "{}" }, {} as Account, {})).toBe(base);
  });
});
