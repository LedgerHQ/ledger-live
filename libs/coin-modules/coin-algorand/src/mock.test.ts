import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import Prando from "prando";
import mock from "./mock";
import type { AlgorandAccount } from "./types";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/mocks/helpers", () => ({
  genAddress: jest.fn(() => "MOCK_ADDRESS"),
  genHex: jest.fn((length: number) => "a".repeat(length)),
}));

describe("mock", () => {
  const createMockAccount = (
    balance: string = "10000000",
    operations: unknown[] = [],
    subAccounts: unknown[] = [],
  ): Account =>
    ({
      id: "mock-account-1",
      balance: new BigNumber(balance),
      spendableBalance: new BigNumber(balance),
      blockHeight: 50000000,
      operations,
      operationsCount: operations.length,
      subAccounts,
      currency: { id: "algorand", ticker: "ALGO" },
    }) as unknown as Account;

  describe("genAccountEnhanceOperations", () => {
    it("should add OPT_IN operation", () => {
      const account = createMockAccount("10000000", []);
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng);

      const optInOps = result.operations.filter(op => op.type === "OPT_IN");
      expect(optInOps.length).toBeGreaterThanOrEqual(1);
    });

    it("should add OPT_OUT operation", () => {
      const account = createMockAccount("10000000", []);
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng);

      const optOutOps = result.operations.filter(op => op.type === "OPT_OUT");
      expect(optOutOps.length).toBeGreaterThanOrEqual(1);
    });

    it("should set algorandResources", () => {
      const account = createMockAccount("10000000", []);
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng) as AlgorandAccount;

      expect(result.algorandResources).not.toBeUndefined();
      expect(result.algorandResources.rewards).toBeInstanceOf(BigNumber);
      expect(result.algorandResources.nbAssets).not.toBeUndefined();
    });

    it("should set rewards to 1% of balance", () => {
      const balance = "10000000";
      const account = createMockAccount(balance, []);
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng) as AlgorandAccount;

      expect(result.algorandResources.rewards.toString()).toBe(
        new BigNumber(balance).multipliedBy(0.01).toString(),
      );
    });

    it("should set nbAssets to subAccounts length", () => {
      const subAccounts = [{ id: "sub-1" }, { id: "sub-2" }, { id: "sub-3" }];
      const account = createMockAccount("10000000", [], subAccounts);
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng) as AlgorandAccount;

      expect(result.algorandResources.nbAssets).toBe(3);
    });

    it("should increment operationsCount", () => {
      const account = createMockAccount("10000000", []);
      const initialCount = account.operationsCount;
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng);

      expect(result.operationsCount).toBeGreaterThan(initialCount);
    });

    it("should generate operations with valid structure", () => {
      const account = createMockAccount("10000000", []);
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng);

      for (const op of result.operations) {
        expect(op).toHaveProperty("id");
        expect(op).toHaveProperty("hash");
        expect(op).toHaveProperty("type");
        expect(op).toHaveProperty("value");
        expect(op).toHaveProperty("fee");
        expect(op).toHaveProperty("senders");
        expect(op).toHaveProperty("recipients");
        expect(op).toHaveProperty("date");
        expect(op).toHaveProperty("extra");
      }
    });

    it("should add assetId to OPT_IN and OPT_OUT extras", () => {
      const account = createMockAccount("10000000", []);
      const rng = new Prando("test-seed");

      const result = mock.genAccountEnhanceOperations(account, rng);

      const optOps = result.operations.filter(op => op.type === "OPT_IN" || op.type === "OPT_OUT");
      for (const op of optOps) {
        expect(op.extra.assetId).not.toBeUndefined();
      }
    });
  });

  describe("postSyncAccount", () => {
    it("should update spendableBalance with rewards", () => {
      const account = createMockAccount("10000000", []) as AlgorandAccount;
      account.algorandResources = {
        rewards: new BigNumber("50000"),
        nbAssets: 0,
      };

      const result = mock.postSyncAccount(account);

      expect(result.spendableBalance.toString()).toBe("10050000");
    });

    it("should handle missing algorandResources", () => {
      const account = createMockAccount("10000000", []);

      const result = mock.postSyncAccount(account);

      expect(result.spendableBalance.toString()).toBe("10000000");
    });

    it("should handle missing rewards", () => {
      const account = createMockAccount("10000000", []) as AlgorandAccount;
      account.algorandResources = {
        rewards: undefined as unknown as BigNumber,
        nbAssets: 0,
      };

      const result = mock.postSyncAccount(account);

      expect(result.spendableBalance.toString()).toBe("10000000");
    });

    it("should return the same account object", () => {
      const account = createMockAccount("10000000", []) as AlgorandAccount;
      account.algorandResources = {
        rewards: new BigNumber("1000"),
        nbAssets: 0,
      };

      const result = mock.postSyncAccount(account);

      expect(result).toBe(account);
    });
  });

  describe("postScanAccount", () => {
    it("should clear operations when isEmpty is true", () => {
      const account = createMockAccount("10000000", [{ id: "op-1" }, { id: "op-2" }]);

      const result = mock.postScanAccount(account, { isEmpty: true });

      expect(result.operations).toEqual([]);
    });

    it("should clear subAccounts when isEmpty is true", () => {
      const account = createMockAccount("10000000", [], [{ id: "sub-1" }]);

      const result = mock.postScanAccount(account, { isEmpty: true });

      expect(result.subAccounts).toEqual([]);
    });

    it("should reset algorandResources when isEmpty is true", () => {
      const account = createMockAccount("10000000", []) as AlgorandAccount;
      account.algorandResources = {
        rewards: new BigNumber("50000"),
        nbAssets: 5,
      };

      const result = mock.postScanAccount(account, { isEmpty: true }) as AlgorandAccount;

      expect(result.algorandResources.rewards.toString()).toBe("0");
      expect(result.algorandResources.nbAssets).toBe(0);
    });

    it("should preserve data when isEmpty is false", () => {
      const operations = [{ id: "op-1" }, { id: "op-2" }];
      const subAccounts = [{ id: "sub-1" }];
      const account = createMockAccount("10000000", operations, subAccounts) as AlgorandAccount;
      account.algorandResources = {
        rewards: new BigNumber("50000"),
        nbAssets: 1,
      };

      const result = mock.postScanAccount(account, { isEmpty: false }) as AlgorandAccount;

      expect(result.operations).toEqual(operations);
      expect(result.subAccounts).toEqual(subAccounts);
      expect(result.algorandResources.rewards.toString()).toBe("50000");
    });

    it("should return the same account object", () => {
      const account = createMockAccount("10000000", []);

      const result = mock.postScanAccount(account, { isEmpty: true });

      expect(result).toBe(account);
    });

    it("should set nbAssets based on original subAccounts length before clearing", () => {
      // Note: nbAssets is calculated before subAccounts is cleared
      const account = createMockAccount("10000000", [], [{ id: "sub-1" }, { id: "sub-2" }]);

      const result = mock.postScanAccount(account, { isEmpty: true }) as AlgorandAccount;

      // nbAssets reflects the count at the time algorandResources was set
      expect(result.algorandResources.nbAssets).toBe(2);
      // But subAccounts is cleared afterwards
      expect(result.subAccounts).toEqual([]);
    });
  });

  describe("export structure", () => {
    it("should export genAccountEnhanceOperations", () => {
      expect(mock.genAccountEnhanceOperations).not.toBeUndefined();
      expect(typeof mock.genAccountEnhanceOperations).toBe("function");
    });

    it("should export postSyncAccount", () => {
      expect(mock.postSyncAccount).not.toBeUndefined();
      expect(typeof mock.postSyncAccount).toBe("function");
    });

    it("should export postScanAccount", () => {
      expect(mock.postScanAccount).not.toBeUndefined();
      expect(typeof mock.postScanAccount).toBe("function");
    });
  });
});
