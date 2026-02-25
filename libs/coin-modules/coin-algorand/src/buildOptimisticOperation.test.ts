import { FeeNotLoaded } from "@ledgerhq/errors";
import type { TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { AlgorandAccount, AlgorandTransaction } from "./types";

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  encodeOperationId: jest.fn((accountId, hash, type) => `${accountId}--${type}`),
}));

describe("buildOptimisticOperation", () => {
  const createMockAccount = (balance: string, subAccounts: TokenAccount[] = []): AlgorandAccount =>
    ({
      id: "algorand-account-1",
      freshAddress: "ALGO_SENDER_ADDRESS",
      spendableBalance: new BigNumber(balance),
      balance: new BigNumber(balance),
      algorandResources: {
        rewards: new BigNumber("0"),
        nbAssets: subAccounts.length,
      },
      subAccounts,
    }) as unknown as AlgorandAccount;

  describe("basic operation creation", () => {
    it("should create operation with correct senders and recipients", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.senders).toEqual(["ALGO_SENDER_ADDRESS"]);
      expect(result.recipients).toEqual(["RECIPIENT_ADDRESS"]);
    });

    it("should set correct fee", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("2500"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.fee.toString()).toBe("2500");
    });

    it("should set accountId from account", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.accountId).toBe("algorand-account-1");
    });

    it("should set date to current time", () => {
      const before = new Date();
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);
      const after = new Date();

      expect(result.date.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.date.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should have empty hash", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.hash).toBe("");
    });

    it("should have null blockHash and blockHeight", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.blockHash).toBeNull();
      expect(result.blockHeight).toBeNull();
    });
  });

  describe("operation type", () => {
    it("should be OUT for send mode", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.type).toBe("OUT");
    });

    it("should be OPT_IN for optIn mode", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "optIn",
        amount: new BigNumber("0"),
        recipient: "ALGO_SENDER_ADDRESS",
        fees: new BigNumber("1000"),
        assetId: "12345",
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.type).toBe("OPT_IN");
    });

    it("should be FEES for subAccount transaction", () => {
      const tokenAccount = {
        id: "token-account-1",
        type: "TokenAccount",
        balance: new BigNumber("1000"),
        token: { id: "algorand/asa/12345" },
      } as unknown as TokenAccount;

      const account = createMockAccount("10000000", [tokenAccount]);
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("100"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        subAccountId: "token-account-1",
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.type).toBe("FEES");
    });
  });

  describe("operation value", () => {
    it("should be amount + fees for regular send", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.value.toString()).toBe("1001000");
    });

    it("should be spendableBalance for useAllAmount", () => {
      const account = createMockAccount("5000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("0"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: true,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.value.toString()).toBe("5000000");
    });

    it("should be fees only for subAccount transaction", () => {
      const tokenAccount = {
        id: "token-account-1",
        type: "TokenAccount",
        balance: new BigNumber("500"),
        token: { id: "algorand/asa/12345" },
      } as unknown as TokenAccount;

      const account = createMockAccount("10000000", [tokenAccount]);
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("100"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("2000"),
        subAccountId: "token-account-1",
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.value.toString()).toBe("2000"); // Only fees
    });
  });

  describe("subOperations", () => {
    it("should include subOperation for token transfer", () => {
      const tokenAccount = {
        id: "token-account-1",
        type: "TokenAccount",
        balance: new BigNumber("1000"),
        token: { id: "algorand/asa/12345" },
      } as unknown as TokenAccount;

      const account = createMockAccount("10000000", [tokenAccount]);
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("500"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        subAccountId: "token-account-1",
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.subOperations).toHaveLength(1);
      expect(result.subOperations?.[0].type).toBe("OUT");
      expect(result.subOperations?.[0].value.toString()).toBe("500");
      expect(result.subOperations?.[0].accountId).toBe("token-account-1");
    });

    it("should use token balance for useAllAmount", () => {
      const tokenAccount = {
        id: "token-account-2",
        type: "TokenAccount",
        balance: new BigNumber("750"),
        token: { id: "algorand/asa/67890" },
      } as unknown as TokenAccount;

      const account = createMockAccount("10000000", [tokenAccount]);
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("0"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        subAccountId: "token-account-2",
        useAllAmount: true,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.subOperations?.[0].value.toString()).toBe("750");
    });

    it("should have zero fee for subOperation", () => {
      const tokenAccount = {
        id: "token-account-1",
        type: "TokenAccount",
        balance: new BigNumber("1000"),
        token: { id: "algorand/asa/12345" },
      } as unknown as TokenAccount;

      const account = createMockAccount("10000000", [tokenAccount]);
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("500"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        subAccountId: "token-account-1",
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.subOperations?.[0].fee.toString()).toBe("0");
    });

    it("should not include subOperations for regular send", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("1000"),
        useAllAmount: false,
      };

      const result = buildOptimisticOperation(account, transaction);

      expect(result.subOperations).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should throw FeeNotLoaded when fees are null", () => {
      const account = createMockAccount("10000000");
      const transaction: AlgorandTransaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        useAllAmount: false,
      };

      expect(() => buildOptimisticOperation(account, transaction)).toThrow(FeeNotLoaded);
    });

    it("should throw FeeNotLoaded when fees are undefined", () => {
      const account = createMockAccount("10000000");
      const transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: undefined,
        useAllAmount: false,
      } as unknown as AlgorandTransaction;

      expect(() => buildOptimisticOperation(account, transaction)).toThrow(FeeNotLoaded);
    });
  });
});
