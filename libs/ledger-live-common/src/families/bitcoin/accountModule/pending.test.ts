import { BigNumber } from "bignumber.js";
import type { CraftedAccountTransaction } from "@ledgerhq/account-module-framework";
import type { Account, Operation } from "@ledgerhq/types-live";
import { decorateOptimisticOperation, isPendingSettled, mergeSentOperation } from "./pending";

const op = (overrides: Partial<Operation>): Operation =>
  ({
    id: `${overrides.hash}-${overrides.type ?? "OUT"}`,
    type: "OUT",
    recipients: [],
    extra: {},
    blockHeight: 10,
    ...overrides,
  }) as Operation;

describe("isPendingSettled", () => {
  const synced = {
    operations: [
      op({ hash: "replacement", extra: { inputs: ["u-0"] } }),
      op({ hash: "still-pending", blockHeight: null, extra: { inputs: ["v-0"] } }),
      op({ hash: "no-extra", extra: undefined }),
    ],
  } as unknown as Account;

  it("settles a pending send whose input a confirmed transaction spends", () => {
    expect(isPendingSettled(op({ hash: "replaced", extra: { inputs: ["u-0"] } }), synced)).toBe(
      true,
    );
  });

  it("keeps it while what spends its inputs is unconfirmed, or when it spends nothing known", () => {
    expect(isPendingSettled(op({ hash: "waiting", extra: { inputs: ["v-0"] } }), synced)).toBe(
      false,
    );
    expect(isPendingSettled(op({ hash: "bare", extra: undefined }), synced)).toBe(false);
  });
});

describe("mergeSentOperation", () => {
  it("keeps the recipient the user entered on the synced send", () => {
    const synced = op({ hash: "sent", recipients: ["from-chain"] });
    expect(
      mergeSentOperation(synced, op({ hash: "sent", recipients: ["entered"] })).recipients,
    ).toEqual(["entered"]);
  });

  it("leaves receives, and sends without an entered recipient, as the chain shows them", () => {
    const received = op({ hash: "sent", type: "IN", recipients: ["mine"] });
    expect(mergeSentOperation(received, op({ recipients: ["entered"] }))).toBe(received);
    const psbt = op({ hash: "psbt", recipients: ["chain"] });
    expect(mergeSentOperation(psbt, op({ recipients: [] }))).toBe(psbt);
  });
});

describe("decorateOptimisticOperation", () => {
  const crafted = (details: Record<string, unknown> | undefined): CraftedAccountTransaction =>
    ({ transaction: "envelope", details, operation: {} }) as unknown as CraftedAccountTransaction;
  const inputRefs = [{ hash: "a", outputIndex: 0, address: "me" }];
  const base = op({
    hash: "",
    blockHeight: null,
    value: new BigNumber(1_150),
    extra: { ledgerOpType: "OUT", inputs: ["a-0"], replaceable: true },
    transactionRaw: {
      family: "bitcoin",
      amount: "1",
      recipient: "typed",
      familySpecificData: { replaceTxId: "r" },
    } as never,
  });
  const familySpecificData = (operation: Operation) =>
    (operation.transactionRaw as never as { familySpecificData: unknown }).familySpecificData;

  it("adds the input references and records the replaceability signed", () => {
    const decorated = decorateOptimisticOperation(
      base,
      crafted({ inputRefs, replaceable: true }),
      {} as Account,
      {},
    );
    expect(decorated.extra).toEqual({ ledgerOpType: "OUT", inputs: ["a-0"], inputRefs });
    expect(familySpecificData(decorated)).toEqual({ replaceTxId: "r", rbf: true });
  });

  it("says when the transaction is final, and leaves an operation without transaction alone", () => {
    const final = decorateOptimisticOperation(base, crafted(undefined), {} as Account, {});
    expect(familySpecificData(final)).toEqual({ replaceTxId: "r", rbf: false });
    expect(final.extra).toEqual({ ledgerOpType: "OUT", inputs: ["a-0"] });

    const withoutRaw = decorateOptimisticOperation(
      { ...base, transactionRaw: undefined, extra: { inputs: ["a-0"] } },
      crafted({}),
      {} as Account,
      {},
    );
    expect(withoutRaw.transactionRaw).toBeUndefined();
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
      familySpecificData(
        decorateOptimisticOperation(
          withStaleRate,
          crafted({ replaceable: true }),
          {} as Account,
          transaction,
        ),
      );

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
});
