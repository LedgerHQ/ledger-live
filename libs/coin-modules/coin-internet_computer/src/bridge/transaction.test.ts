import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import transactionModule, { formatTransaction, fromTransactionRaw } from "./transaction";

jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  getAccountCurrency: () => ({
    units: [{ code: "ICP", magnitude: 8, name: "ICP" }],
  }),
}));

describe("formatTransaction", () => {
  const account = {} as Account;

  it("should format a MAX send", () => {
    const tx = {
      recipient: "abc123",
      useAllAmount: true,
      amount: new BigNumber(0),
    } as any;
    const result = formatTransaction(tx, account);
    expect(result).toContain("MAX");
    expect(result).toContain("abc123");
  });

  it("should format a zero-amount send", () => {
    const tx = {
      recipient: "abc123",
      useAllAmount: false,
      amount: new BigNumber(0),
    } as any;
    const result = formatTransaction(tx, account);
    expect(result).toContain("abc123");
    expect(result).not.toContain("MAX");
  });

  it("should format a specific amount", () => {
    const tx = {
      recipient: "abc123",
      useAllAmount: false,
      amount: new BigNumber(100000000),
    } as any;
    const result = formatTransaction(tx, account);
    expect(result).toContain("abc123");
  });
});

describe("fromTransactionRaw", () => {
  it("should deserialize a raw transaction", () => {
    const raw = {
      family: "internet_computer",
      amount: "50000",
      fees: "10000",
      recipient: "test-recipient",
      memo: "12345",
    } as any;

    const tx = fromTransactionRaw(raw);
    expect(tx.family).toBe("internet_computer");
    expect(tx.amount).toEqual(new BigNumber(50000));
    expect(tx.fees).toEqual(new BigNumber(10000));
    expect(tx.memo).toBe("12345");
  });
});

describe("toTransactionRaw", () => {
  it("should serialize a transaction to raw format", () => {
    const tx = {
      family: "internet_computer",
      amount: new BigNumber(50000),
      fees: new BigNumber(10000),
      recipient: "test-recipient",
      memo: "12345",
    } as any;

    const raw = transactionModule.toTransactionRaw(tx);
    expect(raw.family).toBe("internet_computer");
    expect(raw.amount).toBe("50000");
    expect(raw.fees).toBe("10000");
    expect(raw.memo).toBe("12345");
  });
});
