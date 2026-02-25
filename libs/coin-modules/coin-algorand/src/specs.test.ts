import { DeviceModelId } from "@ledgerhq/devices";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import specs from "./specs";
import type { AlgorandAccount } from "./types";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/account", () => ({
  isAccountEmpty: jest.fn((account: Account) => account.balance?.isZero() ?? true),
}));

jest.mock("@ledgerhq/coin-framework/bot/specs", () => ({
  botTest: jest.fn((name, fn) => fn()),
  genericTestDestination: jest.fn(),
  pickSiblings: jest.fn(siblings => siblings[0]),
}));

jest.mock("@ledgerhq/cryptoassets/index", () => ({
  getCryptoCurrencyById: jest.fn(() => ({
    id: "algorand",
    ticker: "ALGO",
    units: [{ code: "ALGO", magnitude: 6 }],
  })),
}));

jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  parseCurrencyUnit: jest.fn(() => new BigNumber("100000")),
}));

jest.mock("./speculos-deviceActions", () => ({
  acceptTransaction: jest.fn(),
}));

describe("specs", () => {
  const { algorand } = specs;

  describe("algorand AppSpec", () => {
    it("should have correct name", () => {
      expect(algorand.name).toBe("Algorand");
    });

    it("should have currency defined", () => {
      expect(algorand.currency).not.toBeUndefined();
      expect(algorand.currency.id).toBe("algorand");
    });

    it("should have appQuery for nanoS", () => {
      expect(algorand.appQuery).toEqual({
        model: DeviceModelId.nanoS,
        appName: "Algorand",
      });
    });

    it("should have genericDeviceAction", () => {
      expect(algorand.genericDeviceAction).not.toBeUndefined();
    });

    it("should have mutations array", () => {
      expect(algorand.mutations).not.toBeUndefined();
      expect(Array.isArray(algorand.mutations)).toBe(true);
    });
  });

  describe("mutations", () => {
    const findMutation = (name: string) => algorand.mutations.find(m => m.name === name);

    describe("move ~50%", () => {
      const mutation = findMutation("move ~50%");

      it("should exist", () => {
        expect(mutation).not.toBeUndefined();
      });

      it("should have feature 'send'", () => {
        expect(mutation?.feature).toBe("send");
      });

      it("should have testDestination", () => {
        expect(mutation?.testDestination).not.toBeUndefined();
      });

      it("should create transaction with amount ~50% of maxSpendable", () => {
        const account = { freshAddress: "SENDER" } as Account;
        const sibling = { freshAddress: "RECIPIENT", balance: new BigNumber("1000000") } as Account;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("2000000");

        const result = mutation?.transaction?.({
          account,
          siblings: [sibling],
          bridge,
          maxSpendable,
        } as never);

        expect(result?.transaction).not.toBeUndefined();
        expect(result?.updates).toHaveLength(2);
        expect(result?.updates[0].amount).not.toBeUndefined();
        expect(result?.updates[1].recipient).toBe("RECIPIENT");
      });

      it("should have test function", () => {
        expect(mutation?.test).not.toBeUndefined();
      });
    });

    describe("send max", () => {
      const mutation = findMutation("send max");

      it("should exist", () => {
        expect(mutation).not.toBeUndefined();
      });

      it("should have feature 'sendMax'", () => {
        expect(mutation?.feature).toBe("sendMax");
      });

      it("should create transaction with useAllAmount true", () => {
        const account = { freshAddress: "SENDER" } as Account;
        const sibling = { freshAddress: "RECIPIENT", balance: new BigNumber("1000000") } as Account;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("2000000");

        const result = mutation?.transaction?.({
          account,
          siblings: [sibling],
          bridge,
          maxSpendable,
        } as never);

        expect(result?.updates).toContainEqual({ useAllAmount: true });
      });

      it("should have test function that checks spendable balance is low", () => {
        expect(mutation?.test).not.toBeUndefined();
      });
    });

    describe("send ASA ~50%", () => {
      const mutation = findMutation("send ASA ~50%");

      it("should exist", () => {
        expect(mutation).not.toBeUndefined();
      });

      it("should have feature 'tokens'", () => {
        expect(mutation?.feature).toBe("tokens");
      });

      it("should have test function", () => {
        expect(mutation?.test).not.toBeUndefined();
      });
    });

    describe("opt-In ASA available", () => {
      const mutation = findMutation("opt-In ASA available");

      it("should exist", () => {
        expect(mutation).not.toBeUndefined();
      });

      it("should have feature 'tokens'", () => {
        expect(mutation?.feature).toBe("tokens");
      });

      it("should have test function", () => {
        expect(mutation?.test).not.toBeUndefined();
      });
    });

    describe("claim rewards", () => {
      const mutation = findMutation("claim rewards");

      it("should exist", () => {
        expect(mutation).not.toBeUndefined();
      });

      it("should have feature 'staking'", () => {
        expect(mutation?.feature).toBe("staking");
      });

      it("should create transaction with claimReward mode", () => {
        const account = {
          freshAddress: "SENDER",
          algorandResources: {
            rewards: new BigNumber("1000"),
            nbAssets: 0,
          },
        } as AlgorandAccount;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("1000000");

        const result = mutation?.transaction?.({
          account,
          bridge,
          maxSpendable,
        } as never);

        expect(result?.updates).toContainEqual({ mode: "claimReward" });
      });

      it("should have test function that checks rewards are zero", () => {
        expect(mutation?.test).not.toBeUndefined();
      });
    });
  });

  describe("mutation count", () => {
    it("should have 5 mutations", () => {
      expect(algorand.mutations).toHaveLength(5);
    });

    it("should have all expected mutations", () => {
      const mutationNames = algorand.mutations.map(m => m.name);
      expect(mutationNames).toContain("move ~50%");
      expect(mutationNames).toContain("send max");
      expect(mutationNames).toContain("send ASA ~50%");
      expect(mutationNames).toContain("opt-In ASA available");
      expect(mutationNames).toContain("claim rewards");
    });
  });

  describe("helper functions behavior", () => {
    describe("move ~50% mutation transaction", () => {
      const mutation = algorand.mutations.find(m => m.name === "move ~50%");

      it("should throw when maxSpendable is 0", () => {
        const account = { freshAddress: "SENDER" } as Account;
        const sibling = { freshAddress: "RECIPIENT", balance: new BigNumber("1000000") } as Account;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("0");

        expect(() =>
          mutation?.transaction?.({
            account,
            siblings: [sibling],
            bridge,
            maxSpendable,
          } as never),
        ).toThrow("Spendable balance is too low");
      });
    });

    describe("send max mutation transaction", () => {
      const mutation = algorand.mutations.find(m => m.name === "send max");

      it("should throw when maxSpendable is 0", () => {
        const account = { freshAddress: "SENDER" } as Account;
        const sibling = { freshAddress: "RECIPIENT", balance: new BigNumber("1000000") } as Account;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("0");

        expect(() =>
          mutation?.transaction?.({
            account,
            siblings: [sibling],
            bridge,
            maxSpendable,
          } as never),
        ).toThrow("Spendable balance is too low");
      });
    });

    describe("claim rewards mutation transaction", () => {
      const mutation = algorand.mutations.find(m => m.name === "claim rewards");

      it("should throw when no pending rewards", () => {
        const account = {
          freshAddress: "SENDER",
          algorandResources: {
            rewards: new BigNumber("0"),
            nbAssets: 0,
          },
        } as AlgorandAccount;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("1000000");

        expect(() =>
          mutation?.transaction?.({
            account,
            bridge,
            maxSpendable,
          } as never),
        ).toThrow("No pending rewards");
      });

      it("should throw when maxSpendable is 0", () => {
        const account = {
          freshAddress: "SENDER",
          algorandResources: {
            rewards: new BigNumber("1000"),
            nbAssets: 0,
          },
        } as AlgorandAccount;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("0");

        expect(() =>
          mutation?.transaction?.({
            account,
            bridge,
            maxSpendable,
          } as never),
        ).toThrow("Spendable balance is too low");
      });
    });

    describe("opt-In ASA mutation transaction", () => {
      const mutation = algorand.mutations.find(m => m.name === "opt-In ASA available");

      it("should throw when maxSpendable is too low for opt-in", () => {
        const account = {
          freshAddress: "SENDER",
          subAccounts: [],
        } as unknown as Account;
        const bridge = {
          createTransaction: jest.fn(() => ({ family: "algorand" })),
        };
        const maxSpendable = new BigNumber("50000"); // Less than 100000 required

        expect(() =>
          mutation?.transaction?.({
            account,
            bridge,
            maxSpendable,
          } as never),
        ).toThrow("Spendable balance is too low");
      });
    });
  });

  describe("test functions", () => {
    describe("move ~50% test", () => {
      const mutation = algorand.mutations.find(m => m.name === "move ~50%");

      it("should validate balance change", () => {
        const account = { balance: new BigNumber("4000000") } as Account;
        const accountBeforeTransaction = {
          balance: new BigNumber("5000000"),
          algorandResources: { rewards: new BigNumber("0") },
        } as AlgorandAccount;
        const operation = { value: new BigNumber("1000000") };

        expect(() =>
          mutation?.test?.({
            account,
            accountBeforeTransaction,
            operation,
          } as never),
        ).not.toThrow();
      });
    });

    describe("send max test", () => {
      const mutation = algorand.mutations.find(m => m.name === "send max");

      it("should validate spendable balance is low", () => {
        const account = { spendableBalance: new BigNumber("10") } as Account;

        expect(() =>
          mutation?.test?.({
            account,
          } as never),
        ).not.toThrow();
      });
    });

    describe("claim rewards test", () => {
      const mutation = algorand.mutations.find(m => m.name === "claim rewards");

      it("should validate rewards are zero after claim", () => {
        const account = {
          algorandResources: { rewards: new BigNumber("0") },
        } as AlgorandAccount;

        expect(() =>
          mutation?.test?.({
            account,
          } as never),
        ).not.toThrow();
      });
    });
  });
});
