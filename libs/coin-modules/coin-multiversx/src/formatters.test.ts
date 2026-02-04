import formatters from "./formatters";
import BigNumber from "bignumber.js";
import type { MultiversXAccount, MultiversXOperation } from "./types";

jest.mock("@ledgerhq/coin-framework/account", () => ({
  getAccountCurrency: jest.fn(() => ({
    units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
  })),
}));

jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  formatCurrencyUnit: jest.fn((unit, amount, opts) => {
    const value = amount.dividedBy(10 ** unit.magnitude).toFixed(2);
    return opts?.showCode ? `${value} ${unit.code}` : value;
  }),
}));

jest.mock("invariant", () => jest.fn());

describe("formatters", () => {
  describe("formatAccountSpecifics", () => {
    it("formats account with spendable balance", () => {
      const account = {
        spendableBalance: new BigNumber("1000000000000000000"),
        multiversxResources: {
          nonce: 5,
          delegations: [],
          isGuarded: false,
        },
        currency: {
          units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
        },
      } as unknown as MultiversXAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("spendable");
      expect(result).toContain("nonce : 5");
    });

    it("formats account with zero spendable balance", () => {
      const account = {
        spendableBalance: null,
        multiversxResources: {
          nonce: 0,
          delegations: [],
          isGuarded: false,
        },
        currency: {
          units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
        },
      } as unknown as MultiversXAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("0 spendable");
    });

    it("formats account with delegations", () => {
      const account = {
        spendableBalance: new BigNumber("1000000000000000000"),
        multiversxResources: {
          nonce: 5,
          delegations: [
            {
              contract: "erd1...",
              userActiveStake: "5000000000000000000",
              userUndelegatedList: [{ amount: "1000000000000000000" }],
              claimableRewards: "100000000000000000",
            },
          ],
          isGuarded: false,
        },
        currency: {
          units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
        },
      } as unknown as MultiversXAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("delegated");
    });

    it("formats account with undelegating balance", () => {
      const account = {
        spendableBalance: new BigNumber("1000000000000000000"),
        multiversxResources: {
          nonce: 5,
          delegations: [
            {
              contract: "erd1...",
              userActiveStake: "0",
              userUndelegatedList: [{ amount: "2000000000000000000" }],
              claimableRewards: "0",
            },
          ],
          isGuarded: false,
        },
        currency: {
          units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
        },
      } as unknown as MultiversXAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("undelegating");
    });

    it("formats account with rewards", () => {
      const account = {
        spendableBalance: new BigNumber("1000000000000000000"),
        multiversxResources: {
          nonce: 5,
          delegations: [
            {
              contract: "erd1...",
              userActiveStake: "0",
              userUndelegatedList: [],
              claimableRewards: "500000000000000000",
            },
          ],
          isGuarded: false,
        },
        currency: {
          units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
        },
      } as unknown as MultiversXAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).toContain("rewards");
    });

    it("formats account without nonce", () => {
      const account = {
        spendableBalance: new BigNumber("1000000000000000000"),
        multiversxResources: {
          nonce: 0,
          delegations: [],
          isGuarded: false,
        },
        currency: {
          units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
        },
      } as unknown as MultiversXAccount;

      const result = formatters.formatAccountSpecifics(account);

      expect(result).not.toContain("nonce");
    });
  });

  describe("formatOperationSpecifics", () => {
    it("formats operation with amount", () => {
      const operation = {
        extra: {
          amount: new BigNumber("1000000000000000000"),
        },
      } as unknown as MultiversXOperation;

      const unit = { code: "EGLD", magnitude: 18, name: "EGLD" };

      const result = formatters.formatOperationSpecifics(operation, unit);

      expect(result).toContain("amount:");
    });

    it("returns empty string for zero amount", () => {
      const operation = {
        extra: {
          amount: new BigNumber(0),
        },
      } as unknown as MultiversXOperation;

      const unit = { code: "EGLD", magnitude: 18, name: "EGLD" };

      const result = formatters.formatOperationSpecifics(operation, unit);

      expect(result).toBe("");
    });

    it("returns empty string when amount is undefined", () => {
      const operation = {
        extra: {},
      } as unknown as MultiversXOperation;

      const unit = { code: "EGLD", magnitude: 18, name: "EGLD" };

      const result = formatters.formatOperationSpecifics(operation, unit);

      expect(result).toBe("");
    });

    it("formats operation without unit", () => {
      const operation = {
        extra: {
          amount: new BigNumber("1000000000000000000"),
        },
      } as unknown as MultiversXOperation;

      const result = formatters.formatOperationSpecifics(operation, null);

      expect(result).toContain("amount:");
      expect(result).toContain("1000000000000000000");
    });
  });
});
