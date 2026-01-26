import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import formatters from "./formatters";
import type { AlgorandAccount, AlgorandOperation } from "./types";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  getAccountCurrency: jest.fn().mockReturnValue({
    units: [{ name: "Algo", code: "ALGO", magnitude: 6 }],
  }),
}));

jest.mock("@ledgerhq/coin-framework/currencies/index", () => ({
  formatCurrencyUnit: jest
    .fn()
    .mockImplementation((unit: Unit, amount: BigNumber, options?: { showCode?: boolean }) => {
      const code = options?.showCode ? ` ${unit.code}` : "";
      return `${amount.toString()}${code}`;
    }),
}));

describe("formatters", () => {
  describe("formatOperationSpecifics", () => {
    const mockUnit: Unit = {
      name: "Algo",
      code: "ALGO",
      magnitude: 6,
    };

    it("should format operation with rewards", () => {
      const operation = {
        extra: {
          rewards: new BigNumber("1000000"),
        },
      } as AlgorandOperation;

      const result = formatters.formatOperationSpecifics(operation, mockUnit);

      expect(result).toContain("REWARDS");
      expect(result).toContain("1000000");
    });

    it("should return empty string when no rewards", () => {
      const operation = {
        extra: {},
      } as AlgorandOperation;

      const result = formatters.formatOperationSpecifics(operation, mockUnit);

      expect(result).toBe("");
    });

    it("should format zero rewards", () => {
      const operation = {
        extra: {
          rewards: new BigNumber("0"),
        },
      } as AlgorandOperation;

      const result = formatters.formatOperationSpecifics(operation, mockUnit);

      // BigNumber(0) is truthy, so it still formats
      expect(result).toContain("REWARDS");
      expect(result).toContain("0");
    });

    it("should format rewards without unit when unit is null", () => {
      const operation = {
        extra: {
          rewards: new BigNumber("5000000"),
        },
      } as AlgorandOperation;

      const result = formatters.formatOperationSpecifics(operation, null);

      expect(result).toContain("REWARDS");
      expect(result).toContain("5000000");
    });

    it("should format rewards without unit when unit is undefined", () => {
      const operation = {
        extra: {
          rewards: new BigNumber("3000000"),
        },
      } as AlgorandOperation;

      const result = formatters.formatOperationSpecifics(operation, undefined);

      expect(result).toContain("REWARDS");
      expect(result).toContain("3000000");
    });
  });

  describe("formatAccountSpecifics", () => {
    it("should format account with spendable balance", () => {
      const account = {
        spendableBalance: new BigNumber("10000000"),
        algorandResources: {
          rewards: new BigNumber("0"),
          nbAssets: 0,
        },
      } as unknown as AlgorandAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("10000000");
      expect(result).toContain("spendable");
    });

    it("should include rewards when greater than zero", () => {
      const account = {
        spendableBalance: new BigNumber("10000000"),
        algorandResources: {
          rewards: new BigNumber("500000"),
          nbAssets: 2,
        },
      } as unknown as AlgorandAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("spendable");
      expect(result).toContain("rewards");
      expect(result).toContain("500000");
    });

    it("should not include rewards section when rewards are zero", () => {
      const account = {
        spendableBalance: new BigNumber("5000000"),
        algorandResources: {
          rewards: new BigNumber("0"),
          nbAssets: 1,
        },
      } as unknown as AlgorandAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("spendable");
      expect(result).not.toContain("rewards");
    });

    it("should throw when algorandResources is missing", () => {
      const account = {
        spendableBalance: new BigNumber("10000000"),
      } as unknown as AlgorandAccount;

      expect(() => formatters.formatAccountSpecifics(account)).toThrow();
    });
  });
});
