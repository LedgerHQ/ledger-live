import type { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import type { Account, SubAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import transactionModule, { formatTransaction } from "./transaction";
import type { AlgorandTransaction, AlgorandTransactionRaw } from "./types";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  getAccountCurrency: jest.fn().mockImplementation((account: Account) => account.currency),
}));

jest.mock("@ledgerhq/coin-framework/currencies/index", () => ({
  formatCurrencyUnit: jest.fn().mockImplementation((unit: Unit, amount: BigNumber) => {
    return `${amount.toString()} ${unit.code}`;
  }),
}));

describe("transaction", () => {
  const mockUnit: Unit = {
    name: "Algo",
    code: "ALGO",
    magnitude: 6,
  };

  const mockCurrency: CryptoCurrency = {
    type: "CryptoCurrency",
    id: "algorand",
    name: "Algorand",
    ticker: "ALGO",
    scheme: "algorand",
    color: "#000000",
    family: "algorand",
    units: [mockUnit],
    explorerViews: [],
    managerAppName: "Algorand",
  };

  const mockMainAccount = {
    id: "algorand-account-1",
    currency: mockCurrency,
    subAccounts: [] as SubAccount[],
  } as Account;

  describe("formatTransaction", () => {
    it("should format a SEND transaction", () => {
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        subAccountId: undefined,
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = formatTransaction(transaction, mockMainAccount);

      expect(result).toContain("SEND");
      expect(result).toContain("1000000 ALGO");
      expect(result).toContain("TO RECIPIENT_ADDRESS");
      expect(result).toContain("fees=1000 ALGO");
    });

    it("should format a claimReward transaction", () => {
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "claimReward",
        subAccountId: undefined,
        amount: new BigNumber("0"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = formatTransaction(transaction, mockMainAccount);

      expect(result).toContain("CLAIM REWARD");
    });

    it("should format an optIn transaction", () => {
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "optIn",
        subAccountId: undefined,
        amount: new BigNumber("0"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = formatTransaction(transaction, mockMainAccount);

      expect(result).toContain("OPT_IN");
    });

    it("should format MAX amount when useAllAmount is true", () => {
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        subAccountId: undefined,
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: true,
      };

      const result = formatTransaction(transaction, mockMainAccount);

      expect(result).toContain("MAX");
    });

    it("should show ? for undefined fees", () => {
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        subAccountId: undefined,
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        useAllAmount: false,
      };

      const result = formatTransaction(transaction, mockMainAccount);

      expect(result).toContain("fees=?");
    });
  });

  describe("fromTransactionRaw", () => {
    it("should convert raw transaction to transaction", () => {
      const raw: AlgorandTransactionRaw = {
        family: "algorand",
        mode: "send",
        amount: "1000000",
        recipient: "RECIPIENT_ADDRESS",
        fees: "1000",
        memo: "test memo",
        assetId: "12345",
      };

      const result = transactionModule.fromTransactionRaw(raw);

      expect(result.family).toBe("algorand");
      expect(result.mode).toBe("send");
      expect(result.fees).toBeInstanceOf(BigNumber);
      expect(result.fees?.toString()).toBe("1000");
      expect(result.memo).toBe("test memo");
      expect(result.assetId).toBe("12345");
    });

    it("should handle null fees", () => {
      const raw: AlgorandTransactionRaw = {
        family: "algorand",
        mode: "send",
        amount: "1000000",
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        memo: undefined,
        assetId: undefined,
      };

      const result = transactionModule.fromTransactionRaw(raw);

      expect(result.fees).toBeNull();
    });
  });

  describe("toTransactionRaw", () => {
    it("should convert transaction to raw transaction", () => {
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        memo: "test memo",
        assetId: "12345",
      };

      const result = transactionModule.toTransactionRaw(transaction);

      expect(result.family).toBe("algorand");
      expect(result.mode).toBe("send");
      expect(result.fees).toBe("1000");
      expect(result.memo).toBe("test memo");
      expect(result.assetId).toBe("12345");
    });

    it("should handle null fees", () => {
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        memo: undefined,
        assetId: undefined,
      };

      const result = transactionModule.toTransactionRaw(transaction);

      expect(result.fees).toBeNull();
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through toRaw and fromRaw", () => {
      const original: AlgorandTransaction = {
        family: "algorand",
        mode: "optIn",
        amount: new BigNumber("500000"),
        recipient: "SOME_ADDRESS",
        fees: new BigNumber("2000"),
        memo: "round trip test",
        assetId: "99999",
      };

      const raw = transactionModule.toTransactionRaw(original);
      const restored = transactionModule.fromTransactionRaw(raw);

      expect(restored.family).toBe(original.family);
      expect(restored.mode).toBe(original.mode);
      expect(restored.fees?.toString()).toBe(original.fees?.toString());
      expect(restored.memo).toBe(original.memo);
      expect(restored.assetId).toBe(original.assetId);
    });
  });
});
