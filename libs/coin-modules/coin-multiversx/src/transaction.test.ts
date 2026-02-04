import transactionModule, {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
} from "./transaction";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import type { Account } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/coin-framework/account", () => ({
  getAccountCurrency: jest.fn(() => ({
    units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
  })),
}));

jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  formatCurrencyUnit: jest.fn((unit, amount, opts) => {
    const value = amount.dividedBy(10 ** unit.magnitude).toFixed(4);
    return opts?.showCode ? `${value} ${unit.code}` : value;
  }),
}));

jest.mock("@ledgerhq/coin-framework/serialization", () => ({
  fromTransactionCommonRaw: jest.fn(tr => ({
    amount: new BigNumber(tr.amount),
    recipient: tr.recipient,
    useAllAmount: tr.useAllAmount || false,
  })),
  toTransactionCommonRaw: jest.fn(t => ({
    amount: t.amount.toString(),
    recipient: t.recipient,
    useAllAmount: t.useAllAmount,
  })),
  fromTransactionStatusRawCommon: jest.fn(),
  toTransactionStatusRawCommon: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/formatters", () => ({
  formatTransactionStatus: jest.fn(),
}));

describe("transaction", () => {
  describe("formatTransaction", () => {
    const mainAccount = {
      id: "account1",
      subAccounts: [],
      currency: {
        units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
      },
    } as unknown as Account;

    it("formats send transaction with amount", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber("1000000000000000000"),
        recipient: "erd1recipient",
        useAllAmount: false,
        fees: null,
        gasLimit: 50000,
      };

      const result = formatTransaction(transaction, mainAccount);

      expect(result).toContain("SEND");
      expect(result).toContain("TO erd1recipient");
    });

    it("formats transaction with useAllAmount", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber(0),
        recipient: "erd1recipient",
        useAllAmount: true,
        fees: null,
        gasLimit: 50000,
      };

      const result = formatTransaction(transaction, mainAccount);

      expect(result).toContain("MAX");
    });

    it("formats delegate transaction", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "delegate",
        amount: new BigNumber("5000000000000000000"),
        recipient: "erd1validator",
        useAllAmount: false,
        fees: null,
        gasLimit: 12000000,
      };

      const result = formatTransaction(transaction, mainAccount);

      expect(result).toContain("DELEGATE");
    });

    it("formats transaction without recipient", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "claimRewards",
        amount: new BigNumber(0),
        recipient: "",
        useAllAmount: false,
        fees: null,
        gasLimit: 6000000,
      };

      const result = formatTransaction(transaction, mainAccount);

      expect(result).toContain("CLAIMREWARDS");
      expect(result).not.toContain("TO");
    });

    it("formats transaction with zero amount", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "withdraw",
        amount: new BigNumber(0),
        recipient: "erd1validator",
        useAllAmount: false,
        fees: null,
        gasLimit: 12000000,
      };

      const result = formatTransaction(transaction, mainAccount);

      expect(result).toContain("WITHDRAW");
    });

    it("uses subAccount when subAccountId is provided", () => {
      const subAccount = {
        id: "subAccount1",
        type: "TokenAccount",
        token: {
          units: [{ code: "USDC", magnitude: 6, name: "USDC" }],
        },
      };

      const accountWithSub = {
        ...mainAccount,
        subAccounts: [subAccount],
      } as unknown as Account;

      const transaction: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "erd1recipient",
        useAllAmount: false,
        fees: null,
        gasLimit: 500000,
        subAccountId: "subAccount1",
      };

      const result = formatTransaction(transaction, accountWithSub);

      expect(result).toContain("SEND");
    });
  });

  describe("fromTransactionRaw", () => {
    it("converts raw transaction to typed transaction", () => {
      const raw: TransactionRaw = {
        family: "multiversx",
        mode: "send",
        amount: "1000000000000000000",
        recipient: "erd1recipient",
        useAllAmount: false,
        fees: "50000000000000",
        gasLimit: 50000,
      };

      const result = fromTransactionRaw(raw);

      expect(result.family).toBe("multiversx");
      expect(result.mode).toBe("send");
      expect(result.fees).toBeInstanceOf(BigNumber);
      expect(result.fees?.toString()).toBe("50000000000000");
      expect(result.gasLimit).toBe(50000);
    });

    it("handles null fees", () => {
      const raw: TransactionRaw = {
        family: "multiversx",
        mode: "send",
        amount: "1000000000000000000",
        recipient: "erd1recipient",
        useAllAmount: false,
        fees: null,
        gasLimit: 50000,
      };

      const result = fromTransactionRaw(raw);

      expect(result.fees).toBeNull();
    });

    it("handles data field", () => {
      const raw: TransactionRaw = {
        family: "multiversx",
        mode: "delegate",
        amount: "1000000000000000000",
        recipient: "erd1validator",
        useAllAmount: false,
        fees: "50000000000000",
        gasLimit: 12000000,
        data: "ZGVsZWdhdGU=",
      };

      const result = fromTransactionRaw(raw);

      expect(result.data).toBe("ZGVsZWdhdGU=");
    });
  });

  describe("toTransactionRaw", () => {
    it("converts typed transaction to raw", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber("1000000000000000000"),
        recipient: "erd1recipient",
        useAllAmount: false,
        fees: new BigNumber("50000000000000"),
        gasLimit: 50000,
      };

      const result = toTransactionRaw(transaction);

      expect(result.family).toBe("multiversx");
      expect(result.mode).toBe("send");
      expect(result.fees).toBe("50000000000000");
      expect(result.gasLimit).toBe(50000);
    });

    it("handles null fees", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber("1000000000000000000"),
        recipient: "erd1recipient",
        useAllAmount: false,
        fees: null,
        gasLimit: 50000,
      };

      const result = toTransactionRaw(transaction);

      expect(result.fees).toBeNull();
    });

    it("handles data field", () => {
      const transaction: Transaction = {
        family: "multiversx",
        mode: "delegate",
        amount: new BigNumber("1000000000000000000"),
        recipient: "erd1validator",
        useAllAmount: false,
        fees: new BigNumber("50000000000000"),
        gasLimit: 12000000,
        data: "ZGVsZWdhdGU=",
      };

      const result = toTransactionRaw(transaction);

      expect(result.data).toBe("ZGVsZWdhdGU=");
    });
  });

  describe("module exports", () => {
    it("exports all required functions", () => {
      expect(transactionModule.formatTransaction).toBeDefined();
      expect(transactionModule.fromTransactionRaw).toBeDefined();
      expect(transactionModule.toTransactionRaw).toBeDefined();
      expect(transactionModule.fromTransactionStatusRaw).toBeDefined();
      expect(transactionModule.toTransactionStatusRaw).toBeDefined();
      expect(transactionModule.formatTransactionStatus).toBeDefined();
    });
  });
});
