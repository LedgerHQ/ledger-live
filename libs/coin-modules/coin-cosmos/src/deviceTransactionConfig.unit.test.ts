import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account } from "@ledgerhq/types-live";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "./types";

const currency = getCryptoCurrencyById("cosmos");
const account = {
  type: "Account",
  currency,
  freshAddress: "cosmos1source",
} as unknown as Account;

const baseTransaction = {
  family: "cosmos",
  mode: "send",
  amount: new BigNumber(1000000),
  recipient: "cosmos1recipient",
  fees: new BigNumber(500),
  gas: new BigNumber(200000),
  memoType: null,
  memoValue: null,
  networkInfo: null,
  useAllAmount: false,
} as unknown as Transaction;

const stakingTransaction = (patch: Record<string, unknown>) =>
  ({
    ...baseTransaction,
    ...patch,
  }) as unknown as Transaction;

const status = (patch: Record<string, unknown> = {}) =>
  ({
    amount: new BigNumber(1000000),
    estimatedFees: new BigNumber(500),
    ...patch,
  }) as unknown as TransactionStatus;

const run = (transaction: Transaction, transactionStatus: TransactionStatus = status()) =>
  getDeviceTransactionConfig({
    account,
    parentAccount: undefined,
    transaction,
    status: transactionStatus,
  });

const labels = (fields: Array<{ label: string }>) => fields.map(field => field.label);

describe("getDeviceTransactionConfig", () => {
  it("lists type, amount, sender and fees for a send", async () => {
    const fields = await run(baseTransaction);

    expect(fields).toEqual([
      { type: "text", label: "Type", value: "Send" },
      { type: "amount", label: "Amount", value: "1\u00a0ATOM" },
      { type: "address", label: "From", address: "cosmos1source" },
      { type: "fees", label: "Fee" },
    ]);
  });

  it("omits the amount of a send when it is zero", async () => {
    const fields = await run(baseTransaction, status({ amount: new BigNumber(0) }));

    expect(labels(fields)).toEqual(["Type", "From", "Fee"]);
  });

  it("omits the fees when they are zero or unknown", async () => {
    const zeroFees = await run(baseTransaction, status({ estimatedFees: new BigNumber(0) }));
    const unknownFees = await run(baseTransaction, status({ estimatedFees: undefined }));

    expect(labels(zeroFees)).not.toContain("Fee");
    expect(labels(unknownFees)).not.toContain("Fee");
  });

  it("shows the memo from memoValue before the fees", async () => {
    const fields = await run({
      ...baseTransaction,
      memoType: "text",
      memoValue: "invoice 42",
    } as Transaction);

    expect(fields.slice(-2)).toEqual([
      { type: "text", label: "Memo", value: "invoice 42" },
      { type: "fees", label: "Fee" },
    ]);
  });

  it("shows no memo when memoValue is empty", async () => {
    const fields = await run({ ...baseTransaction, memoValue: "" } as Transaction);

    expect(labels(fields)).not.toContain("Memo");
  });

  it("describes a delegation", async () => {
    const fields = await run(stakingTransaction({ mode: "delegate", valAddress: "validator" }));

    expect(fields).toEqual([
      { type: "text", label: "Type", value: "Delegate" },
      { type: "cosmos.delegateValidators", label: "Validators" },
      { type: "fees", label: "Fee" },
    ]);
  });

  it("describes an undelegation", async () => {
    const fields = await run(stakingTransaction({ mode: "undelegate", valAddress: "validator" }));

    expect(fields).toEqual([
      { type: "text", label: "Type", value: "Undelegate" },
      { type: "text", label: "Amount", value: "1\u00a0ATOM" },
      { type: "cosmos.validatorName", label: "Validator" },
      { type: "fees", label: "Fee" },
    ]);
  });

  it("describes a redelegation", async () => {
    const fields = await run(
      stakingTransaction({
        mode: "redelegate",
        valAddress: "source",
        dstValAddress: "destination",
      }),
    );

    expect(fields).toEqual([
      { type: "text", label: "Type", value: "Redelegate" },
      { type: "text", label: "Amount", value: "1\u00a0ATOM" },
      { type: "cosmos.validatorName", label: "Validator Dest" },
      { type: "cosmos.sourceValidatorName", label: "Validator Source" },
      { type: "fees", label: "Fee" },
    ]);
  });

  it("describes a reward claim", async () => {
    const fields = await run(stakingTransaction({ mode: "claimReward", valAddress: "validator" }));

    expect(fields).toEqual([
      { type: "text", label: "Type", value: "Withdraw Reward" },
      { type: "cosmos.validatorName", label: "Validator" },
      { type: "fees", label: "Fee" },
    ]);
  });

  it.each(["claimRewardCompound", "compoundReward"])(
    "describes %s as a withdrawal followed by a delegation",
    async mode => {
      const fields = await run(stakingTransaction({ mode, valAddress: "validator" }));

      expect(fields).toEqual([
        { type: "text", label: "Type", value: "Withdraw Reward" },
        { type: "cosmos.validatorName", label: "Validator" },
        { type: "text", label: "Type", value: "Delegate" },
        { type: "cosmos.delegateValidators", label: "Validators" },
        { type: "fees", label: "Fee" },
      ]);
    },
  );

  it("lists only the memo and fees for an unknown mode", async () => {
    const fields = await run(
      stakingTransaction({ mode: "unknown", memoType: "text", memoValue: "hello" }),
    );

    expect(labels(fields)).toEqual(["Memo", "Fee"]);
  });
});
