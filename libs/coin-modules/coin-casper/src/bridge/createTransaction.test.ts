import BigNumber from "bignumber.js";
import { createTransaction } from "./createTransaction";
import { Transaction } from "../types";
import { Account, AccountLike } from "@ledgerhq/types-live";

describe("createTransaction", () => {
  it("should create a transaction with default values", () => {
    const transaction = createTransaction({} as AccountLike<Account>);
    const expectedTransaction: Transaction = {
      family: "casper",
      amount: new BigNumber(0),
      fees: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
    };
    expect(transaction).toEqual(expectedTransaction);
  });

  it("should create a transaction with the correct family", () => {
    const transaction = createTransaction({} as AccountLike<Account>);
    expect(transaction.family).toBe("casper");
  });

  it("should create a transaction with default amount set to zero", () => {
    const transaction = createTransaction({} as AccountLike<Account>);
    expect(transaction.amount.isEqualTo(new BigNumber(0))).toBe(true);
  });

  it("should create a transaction with default fees set to zero", () => {
    const transaction = createTransaction({} as AccountLike<Account>);
    expect(transaction.fees.isEqualTo(new BigNumber(0))).toBe(true);
  });

  it("should create a transaction with empty recipient", () => {
    const transaction = createTransaction({} as AccountLike<Account>);
    expect(transaction.recipient).toBe("");
  });

  it("should create a transaction with useAllAmount set to false", () => {
    const transaction = createTransaction({} as AccountLike<Account>);
    expect(transaction.useAllAmount).toBe(false);
  });
});
