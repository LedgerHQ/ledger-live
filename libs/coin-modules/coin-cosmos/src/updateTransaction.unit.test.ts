import { BigNumber } from "bignumber.js";
import updateTransactionDefault, { updateTransaction } from "./updateTransaction";
import type { Transaction } from "./types";

const delegation = {
  family: "cosmos",
  mode: "delegate",
  amount: new BigNumber(1),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(10),
  gas: new BigNumber(20),
  memo: null,
  networkInfo: null,
  valAddress: "validator",
} as Transaction;

const redelegation = {
  ...delegation,
  mode: "redelegate",
  valAddress: "source",
  dstValAddress: "destination",
} as Transaction;

describe("updateTransaction", () => {
  it("is the default export", () => {
    expect(updateTransactionDefault).toBe(updateTransaction);
  });

  it("keeps the fees and gas when the patch changes nothing that affects them", () => {
    const updated = updateTransaction(delegation, { amount: new BigNumber(2) });

    expect(updated.fees).toEqual(new BigNumber(10));
    expect(updated.gas).toEqual(new BigNumber(20));
  });

  it("keeps the fees and gas when the patch repeats the current validator", () => {
    const updated = updateTransaction(delegation, { valAddress: "validator" });

    expect(updated.fees).toEqual(new BigNumber(10));
    expect(updated.gas).toEqual(new BigNumber(20));
  });

  it("resets the fees and gas when the mode changes", () => {
    const updated = updateTransaction(delegation, { mode: "claimReward" });

    expect(updated.mode).toBe("claimReward");
    expect(updated.fees).toBeNull();
    expect(updated.gas).toBeNull();
  });

  it("keeps the fees and gas when the patch repeats the current mode", () => {
    const updated = updateTransaction(delegation, { mode: "delegate" });

    expect(updated.fees).toEqual(new BigNumber(10));
  });

  it("resets the fees and gas when valAddress changes", () => {
    const updated = updateTransaction(delegation, { valAddress: "other" });

    expect(updated).toMatchObject({ valAddress: "other", fees: null, gas: null });
  });

  it("resets the fees and gas when dstValAddress changes", () => {
    const updated = updateTransaction(redelegation, { dstValAddress: "other" });

    expect(updated).toMatchObject({ dstValAddress: "other", fees: null, gas: null });
  });

  it("keeps the fees and gas when the patch repeats the current dstValAddress", () => {
    const updated = updateTransaction(redelegation, { dstValAddress: "destination" });

    expect(updated.fees).toEqual(new BigNumber(10));
  });

  it("sets dstValAddress on a transaction that had none", () => {
    const updated = updateTransaction(delegation, { dstValAddress: "destination" });

    expect(updated).toMatchObject({ dstValAddress: "destination", fees: null, gas: null });
  });
});
