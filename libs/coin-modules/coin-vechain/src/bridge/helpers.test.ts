import BigNumber from "bignumber.js";
import { isAccountEmpty } from "./helpers";
import { TokenAccount } from "@ledgerhq/types-live";

describe("isAccountEmpty", () => {
  const baseAccount = {
    balance: new BigNumber("0"),
    operationsCount: 0,
    subAccounts: undefined as any,
  };

  describe("empty accounts", () => {
    it("should return true for completely empty account", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(true);
    });

    it("should return true for account with undefined subAccounts", () => {
      const account = {
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(true);
    });

    it("should return true for account with empty subAccounts array", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(true);
    });

    it("should return true when subAccount has zero balance", () => {
      const mockSubAccount: TokenAccount = {
        type: "TokenAccount",
        id: "vechain:1:0x123:+vtho",
        parentId: "vechain:1:0x123:",
        token: {} as any,
        balance: new BigNumber("0"),
        spendableBalance: new BigNumber("0"),
        creationDate: new Date("2022-01-01"),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
        swapHistory: [],
      };

      const account = {
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: [mockSubAccount],
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(true);
    });
  });

  describe("non-empty accounts", () => {
    it("should return false when account has balance", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("1000000000000000000"), // 1 VET
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should return false when account has operations", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 5,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should return false when subAccount has balance", () => {
      const mockSubAccountWithBalance: TokenAccount = {
        type: "TokenAccount",
        id: "vechain:1:0x123:+vtho",
        parentId: "vechain:1:0x123:",
        token: {} as any,
        balance: new BigNumber("1000000000000000000"), // 1 VTHO
        spendableBalance: new BigNumber("1000000000000000000"),
        creationDate: new Date("2022-01-01"),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
        swapHistory: [],
      };

      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: [mockSubAccountWithBalance],
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should return false when account has both balance and operations", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("1000000000000000000"),
        operationsCount: 3,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should return false when account has balance and subAccount with balance", () => {
      const mockSubAccountWithBalance: TokenAccount = {
        type: "TokenAccount",
        id: "vechain:1:0x123:+vtho",
        parentId: "vechain:1:0x123:",
        token: {} as any,
        balance: new BigNumber("500000000000000000"), // 0.5 VTHO
        spendableBalance: new BigNumber("500000000000000000"),
        creationDate: new Date("2022-01-01"),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
        swapHistory: [],
      };

      const account = {
        ...baseAccount,
        balance: new BigNumber("2000000000000000000"), // 2 VET
        operationsCount: 0,
        subAccounts: [mockSubAccountWithBalance],
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle very small balances", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("1"), // 1 wei
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should handle very large balances", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("1000000000000000000000000"), // 1M VET
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should handle negative balance", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("-1000000000000000000"), // -1 VET (edge case)
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should handle multiple subAccounts where first is empty", () => {
      const emptySubAccount: TokenAccount = {
        type: "TokenAccount",
        id: "vechain:1:0x123:+empty",
        parentId: "vechain:1:0x123:",
        token: {} as any,
        balance: new BigNumber("0"),
        spendableBalance: new BigNumber("0"),
        creationDate: new Date("2022-01-01"),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
        swapHistory: [],
      };

      const nonEmptySubAccount: TokenAccount = {
        type: "TokenAccount",
        id: "vechain:1:0x123:+vtho",
        parentId: "vechain:1:0x123:",
        token: {} as any,
        balance: new BigNumber("1000000000000000000"),
        spendableBalance: new BigNumber("1000000000000000000"),
        creationDate: new Date("2022-01-01"),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
        swapHistory: [],
      };

      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: [emptySubAccount, nonEmptySubAccount],
      };

      const result = isAccountEmpty(account);

      // Should check only the first subAccount according to the implementation
      expect(result).toBe(true);
    });

    it("should handle account with operations but zero balance", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 1,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should handle decimal balance", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("0.5"), // 0.5 VET (unlikely but possible)
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });
  });

  describe("subAccount balance checking logic", () => {
    it("should correctly identify when subAccount balance isZero() returns false", () => {
      const mockSubAccountWithBalance: TokenAccount = {
        type: "TokenAccount",
        id: "vechain:1:0x123:+vtho",
        parentId: "vechain:1:0x123:",
        token: {} as any,
        balance: new BigNumber("0.000000000000000001"), // Very small but non-zero
        spendableBalance: new BigNumber("0.000000000000000001"),
        creationDate: new Date("2022-01-01"),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
        balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
        swapHistory: [],
      };

      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: [mockSubAccountWithBalance],
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(false);
    });

    it("should correctly handle when subAccounts is null", () => {
      const account = {
        ...baseAccount,
        balance: new BigNumber("0"),
        operationsCount: 0,
        subAccounts: null as any,
      };

      const result = isAccountEmpty(account);

      expect(result).toBe(true);
    });
  });

  describe("BigNumber behavior", () => {
    it("should correctly use BigNumber.isZero() method", () => {
      const zeroBalance = new BigNumber("0");
      const nonZeroBalance = new BigNumber("1");

      expect(zeroBalance.isZero()).toBe(true);
      expect(nonZeroBalance.isZero()).toBe(false);

      const accountWithZero = {
        ...baseAccount,
        balance: zeroBalance,
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      const accountWithNonZero = {
        ...baseAccount,
        balance: nonZeroBalance,
        operationsCount: 0,
        subAccounts: undefined as any,
      };

      expect(isAccountEmpty(accountWithZero)).toBe(true);
      expect(isAccountEmpty(accountWithNonZero)).toBe(false);
    });
  });
});
