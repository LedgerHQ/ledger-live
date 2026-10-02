import { BigNumber } from "bignumber.js";
import { fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { Transaction, TransactionRaw } from "./types";

const baseRaw = {
  family: "cosmos",
  mode: "send",
  networkInfo: null,
  fees: null,
  gas: null,
  memo: "test memo",
  sourceValidator: null,
  validators: [],
  amount: "1000000",
  recipient: "cosmosrecipientaddress",
} as unknown as TransactionRaw;

const baseTransaction = {
  family: "cosmos",
  mode: "send",
  networkInfo: null,
  fees: null,
  gas: null,
  memo: "test memo",
  sourceValidator: null,
  validators: [],
  amount: new BigNumber("1000000"),
  recipient: "cosmosrecipientaddress",
} as unknown as Transaction;

describe("fromTransactionRaw", () => {
  it("carries memoType and memoValue over when present", () => {
    const result = fromTransactionRaw({ ...baseRaw, memoType: "text", memoValue: "test memo" });
    expect(result.memoType).toEqual("text");
    expect(result.memoValue).toEqual("test memo");
  });

  it("omits memoType and memoValue when absent", () => {
    const result = fromTransactionRaw({ ...baseRaw, memo: undefined });
    expect(result).not.toHaveProperty("memoType");
    expect(result).not.toHaveProperty("memoValue");
  });

  it("should put legacy memo into memoValue", () => {
    const result = fromTransactionRaw(baseRaw);
    expect(result.memoType).toEqual("text");
    expect(result.memoValue).toEqual("test memo");
  });
});

describe("toTransactionRaw", () => {
  it("carries memoType and memoValue over when present", () => {
    const result = toTransactionRaw({
      ...baseTransaction,
      memoType: "text",
      memoValue: "test memo",
    });
    expect(result.memoType).toBe("text");
    expect(result.memoValue).toBe("test memo");
  });

  it("omits memoType and memoValue when absent", () => {
    const result = toTransactionRaw(baseTransaction);
    expect(result).not.toHaveProperty("memoType");
    expect(result).not.toHaveProperty("memoValue");
  });
});
