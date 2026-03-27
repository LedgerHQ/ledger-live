/* eslint-disable @typescript-eslint/consistent-type-assertions */
jest.mock("@ledgerhq/coin-framework/currencies/index", () => ({
  formatCurrencyUnit: jest.fn().mockReturnValue("1000 MINA"),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  getAccountCurrency: jest.fn().mockReturnValue({
    units: [{ code: "MINA", name: "MINA", magnitude: 9 }],
  }),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/serialization", () => ({
  fromTransactionCommonRaw: jest.fn((raw: Record<string, unknown>) => ({
    recipient: raw.recipient,
    useAllAmount: raw.useAllAmount ?? false,
  })),
  toTransactionCommonRaw: jest.fn((tx: Record<string, unknown>) => ({
    recipient: tx.recipient,
    useAllAmount: tx.useAllAmount ?? false,
  })),
  fromTransactionStatusRawCommon: jest.fn(),
  toTransactionStatusRawCommon: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/formatters", () => ({
  formatTransactionStatus: jest.fn(),
}));

import BigNumber from "bignumber.js";
import { createMockAccount, createMockTransaction } from "../test/fixtures";
import type { TransactionRaw } from "../types/common";
import transactionModule, { formatTransaction, fromTransactionRaw } from "./transaction";

const { toTransactionRaw } = transactionModule;

describe("transaction", () => {
  const baseRaw = {
    family: "mina" as const,
    amount: "5000000000",
    recipient: "B62qr5cXFjdnZXYxP5dEwRY7wENxcod4Q2oLxUDiq1QrBXZZyxMH8q4",
    fees: { fee: "10000000", accountCreationFee: "1000000000" },
    memo: "hello",
    nonce: 42,
  } satisfies TransactionRaw;

  describe("fromTransactionRaw", () => {
    it("should convert fee strings to BigNumbers", () => {
      const result = fromTransactionRaw(baseRaw);

      expect(result.fees.fee).toEqual(new BigNumber("10000000"));
      expect(result.fees.accountCreationFee).toEqual(new BigNumber("1000000000"));
    });

    it("should convert amount string to BigNumber", () => {
      const result = fromTransactionRaw(baseRaw);

      expect(result.amount).toEqual(new BigNumber("5000000000"));
    });

    it("should preserve memo and nonce", () => {
      const result = fromTransactionRaw(baseRaw);

      expect(result.memo).toBe("hello");
      expect(result.nonce).toBe(42);
    });

    it("should set txType when present in raw", () => {
      const result = fromTransactionRaw({ ...baseRaw, txType: "stake" });

      expect(result.txType).toBe("stake");
    });

    it("should set txType when value is unstake", () => {
      const result = fromTransactionRaw({ ...baseRaw, txType: "unstake" });

      expect(result.txType).toBe("unstake");
    });

    it("should not set txType when absent", () => {
      const result = fromTransactionRaw(baseRaw);

      expect(result.txType).toBeUndefined();
    });
  });

  describe("toTransactionRaw", () => {
    it("should convert BigNumber fees to strings", () => {
      const tx = createMockTransaction({
        fees: { fee: new BigNumber("10000000"), accountCreationFee: new BigNumber("1000000000") },
      });

      const result = toTransactionRaw(tx);

      expect(result.fees.fee).toBe("10000000");
      expect(result.fees.accountCreationFee).toBe("1000000000");
    });

    it("should convert BigNumber amount to fixed string", () => {
      const tx = createMockTransaction({ amount: new BigNumber("5000000000") });

      const result = toTransactionRaw(tx);

      expect(result.amount).toBe("5000000000");
    });

    it("should include txType when present", () => {
      const tx = createMockTransaction({ txType: "stake" });

      const result = toTransactionRaw(tx);

      expect(result.txType).toBe("stake");
    });

    it("should include txType unstake when present", () => {
      const tx = createMockTransaction({ txType: "unstake" });

      const result = toTransactionRaw(tx);

      expect(result.txType).toBe("unstake");
    });

    it("should not include txType when absent", () => {
      const tx = createMockTransaction();

      const result = toTransactionRaw(tx);

      expect(result.txType).toBeUndefined();
    });

    it("should handle undefined memo", () => {
      const tx = createMockTransaction({ memo: undefined });

      const result = toTransactionRaw(tx);

      expect(result.memo).toBeUndefined();
    });
  });

  describe("roundtrip", () => {
    it("should preserve Mina-specific fields through fromRaw(toRaw(tx))", () => {
      const original = createMockTransaction({
        amount: new BigNumber("5000000000"),
        fees: { fee: new BigNumber("10000000"), accountCreationFee: new BigNumber("1000000000") },
        memo: "roundtrip",
        nonce: 99,
        txType: "stake",
      });

      const restored = fromTransactionRaw(toTransactionRaw(original));

      expect(restored.fees.fee).toEqual(original.fees.fee);
      expect(restored.fees.accountCreationFee).toEqual(original.fees.accountCreationFee);
      expect(restored.amount).toEqual(original.amount);
      expect(restored.memo).toBe(original.memo);
      expect(restored.nonce).toBe(original.nonce);
      expect(restored.txType).toBe(original.txType);
    });

    it("should preserve txType unstake through fromRaw(toRaw(tx))", () => {
      const original = createMockTransaction({ txType: "unstake" });

      const restored = fromTransactionRaw(toTransactionRaw(original));

      expect(restored.txType).toBe("unstake");
    });
  });

  describe("formatTransaction", () => {
    const account = createMockAccount();

    it("should format MAX when useAllAmount is true", () => {
      const tx = createMockTransaction({ useAllAmount: true });

      const result = formatTransaction(tx, account);

      expect(result).toContain("MAX");
      expect(result).toContain(tx.recipient);
    });

    it("should include formatted amount when amount > 0", () => {
      const tx = createMockTransaction({ amount: new BigNumber(1000), useAllAmount: false });

      const result = formatTransaction(tx, account);

      expect(result).toContain("SEND");
      expect(result).toContain("1000 MINA");
      expect(result).toContain(tx.recipient);
    });

    it("should omit amount when zero", () => {
      const tx = createMockTransaction({ amount: new BigNumber(0), useAllAmount: false });

      const result = formatTransaction(tx, account);

      expect(result).toContain("SEND");
      expect(result).toContain(tx.recipient);
      expect(result).not.toContain("MINA");
    });
  });
});
