import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "./buildOptimisticOperatioin";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "../types";
import { Account } from "@ledgerhq/types-live";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/operation");

const mockedEncodeOperationId = jest.mocked(encodeOperationId);

describe("buildOptimisticOperation", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "vechain:1:0x123:",
    seedIdentifier: "seed123",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
    freshAddressPath: "44'/818'/0'/0/0",
    used: true,
    balance: new BigNumber("5000000000000000000"),
    spendableBalance: new BigNumber("5000000000000000000"),
    creationDate: new Date("2022-01-01"),
    blockHeight: 12345,
    currency: {} as any,
    operationsCount: 10,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2022-01-01"),
    balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
    swapHistory: [],
    subAccounts: [],
  };

  const mockVetTransaction: Transaction = {
    family: "vechain",
    recipient: "0x456789012345678901234567890123456789abcd",
    amount: new BigNumber("1000000000000000000"),
    estimatedFees: "210000000000000000",
    body: {
      chainTag: 74,
      blockRef: "0x00000000000b2bce",
      expiration: 18,
      clauses: [],
      maxFeePerGas: 10000000000000,
      maxPriorityFeePerGas: 1000000000000,
      gas: 21000,
      dependsOn: null,
      nonce: "0x12345678",
    },
  } as Transaction;

  const mockTokenTransaction: Transaction = {
    ...mockVetTransaction,
    subAccountId: "vechain:1:0x123:+vtho",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedEncodeOperationId.mockImplementation(
      (accountId, hash, type) => `${accountId}${hash}${type}`,
    );
  });

  describe("VET transactions", () => {
    it("should build optimistic operation for VET transaction", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result).toEqual({
        id: "vechain:1:0x123:OUT",
        hash: "",
        type: "OUT",
        value: new BigNumber("1000000000000000000"),
        fee: new BigNumber("210000000000000000"),
        blockHash: null,
        blockHeight: null,
        senders: ["0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4"],
        recipients: ["0x456789012345678901234567890123456789abcd"],
        accountId: "vechain:1:0x123:",
        date: expect.any(Date),
        extra: {},
        subOperations: [],
      });

      expect(mockedEncodeOperationId).toHaveBeenCalledWith("vechain:1:0x123:", "", "OUT");
    });

    it("should set correct value and fee for VET transaction", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result.value).toEqual(new BigNumber("1000000000000000000"));
      expect(result.fee).toEqual(new BigNumber("210000000000000000"));
    });

    it("should have empty subOperations for VET transaction", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result.subOperations).toEqual([]);
    });
  });

  describe("Token transactions", () => {
    it("should build optimistic operation for token transaction", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockTokenTransaction);

      expect(result).toEqual({
        id: "vechain:1:0x123:OUT",
        hash: "",
        type: "NONE",
        value: new BigNumber("0"),
        fee: new BigNumber("0"),
        blockHash: null,
        blockHeight: null,
        senders: ["0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4"],
        recipients: ["0x456789012345678901234567890123456789abcd"],
        accountId: "vechain:1:0x123:",
        date: expect.any(Date),
        extra: {},
        subOperations: [
          {
            id: "vechain:1:0x123:+vthoOUT",
            hash: "",
            type: "OUT",
            value: new BigNumber("1000000000000000000"),
            fee: new BigNumber("210000000000000000"),
            blockHash: null,
            blockHeight: null,
            senders: ["0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4"],
            recipients: ["0x456789012345678901234567890123456789abcd"],
            accountId: "vechain:1:0x123:+vtho",
            date: expect.any(Date),
            extra: {},
          },
        ],
      });

      expect(mockedEncodeOperationId).toHaveBeenCalledWith("vechain:1:0x123:", "", "OUT");
      expect(mockedEncodeOperationId).toHaveBeenCalledWith("vechain:1:0x123:+vtho", "", "OUT");
    });

    it("should set type to NONE for token transaction main operation", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockTokenTransaction);

      expect(result.type).toBe("NONE");
    });

    it("should have zero value and fee for token transaction main operation", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockTokenTransaction);

      expect(result.value).toEqual(new BigNumber("0"));
      expect(result.fee).toEqual(new BigNumber("0"));
    });

    it("should create correct subOperation for token transaction", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockTokenTransaction);

      expect(result.subOperations).toHaveLength(1);
      const subOp = result.subOperations![0];

      expect(subOp.type).toBe("OUT");
      expect(subOp.value).toEqual(new BigNumber("1000000000000000000"));
      expect(subOp.fee).toEqual(new BigNumber("210000000000000000"));
      expect(subOp.accountId).toBe("vechain:1:0x123:+vtho");
    });
  });

  describe("Common operation properties", () => {
    it("should set empty hash for both transaction types", async () => {
      const vetResult = await buildOptimisticOperation(mockAccount, mockVetTransaction);
      const tokenResult = await buildOptimisticOperation(mockAccount, mockTokenTransaction);

      expect(vetResult.hash).toBe("");
      expect(tokenResult.hash).toBe("");
      if (tokenResult.subOperations && tokenResult.subOperations[0]) {
        expect(tokenResult.subOperations[0].hash).toBe("");
      }
    });

    it("should set null blockHash and blockHeight", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result.blockHash).toBe(null);
      expect(result.blockHeight).toBe(null);
    });

    it("should set senders from account freshAddress", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result.senders).toEqual(["0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4"]);
    });

    it("should set recipients from transaction recipient", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result.recipients).toEqual(["0x456789012345678901234567890123456789abcd"]);
    });

    it("should filter out empty recipients", async () => {
      const transactionWithoutRecipient = {
        ...mockVetTransaction,
        recipient: "",
      };

      const result = await buildOptimisticOperation(mockAccount, transactionWithoutRecipient);

      expect(result.recipients).toEqual([]);
    });

    it("should set accountId from account", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result.accountId).toBe("vechain:1:0x123:");
    });

    it("should set current date", async () => {
      const before = new Date();
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);
      const after = new Date();

      expect(result.date.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.date.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should set empty extra object", async () => {
      const result = await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(result.extra).toEqual({});
    });
  });

  describe("encodeOperationId calls", () => {
    it("should call encodeOperationId with correct parameters for VET transaction", async () => {
      await buildOptimisticOperation(mockAccount, mockVetTransaction);

      expect(mockedEncodeOperationId).toHaveBeenCalledTimes(1);
      expect(mockedEncodeOperationId).toHaveBeenCalledWith("vechain:1:0x123:", "", "OUT");
    });

    it("should call encodeOperationId twice for token transaction", async () => {
      await buildOptimisticOperation(mockAccount, mockTokenTransaction);

      expect(mockedEncodeOperationId).toHaveBeenCalledTimes(2);
      expect(mockedEncodeOperationId).toHaveBeenNthCalledWith(1, "vechain:1:0x123:", "", "OUT");
      expect(mockedEncodeOperationId).toHaveBeenNthCalledWith(
        2,
        "vechain:1:0x123:+vtho",
        "",
        "OUT",
      );
    });
  });

  describe("different transaction amounts and fees", () => {
    it("should handle different transaction amounts", async () => {
      const customAmountTransaction = {
        ...mockVetTransaction,
        amount: new BigNumber("2500000000000000000"), // 2.5 VET
      };

      const result = await buildOptimisticOperation(mockAccount, customAmountTransaction);

      expect(result.value).toEqual(new BigNumber("2500000000000000000"));
    });

    it("should handle different estimated fees", async () => {
      const customFeeTransaction = {
        ...mockVetTransaction,
        estimatedFees: "420000000000000000", // 0.42 VET
      };

      const result = await buildOptimisticOperation(mockAccount, customFeeTransaction);

      expect(result.fee).toEqual(new BigNumber("420000000000000000"));
    });

    it("should handle zero amounts", async () => {
      const zeroAmountTransaction = {
        ...mockVetTransaction,
        amount: new BigNumber("0"),
      };

      const result = await buildOptimisticOperation(mockAccount, zeroAmountTransaction);

      expect(result.value).toEqual(new BigNumber("0"));
    });

    it("should handle very large amounts", async () => {
      const largeAmountTransaction = {
        ...mockVetTransaction,
        amount: new BigNumber("1000000000000000000000000"), // 1M VET
      };

      const result = await buildOptimisticOperation(mockAccount, largeAmountTransaction);

      expect(result.value).toEqual(new BigNumber("1000000000000000000000000"));
    });
  });

  describe("different account and subAccount IDs", () => {
    it("should handle different account IDs", async () => {
      const customAccount = {
        ...mockAccount,
        id: "vechain:2:0xabc:",
      };

      const result = await buildOptimisticOperation(customAccount, mockVetTransaction);

      expect(result.accountId).toBe("vechain:2:0xabc:");
      expect(mockedEncodeOperationId).toHaveBeenCalledWith("vechain:2:0xabc:", "", "OUT");
    });

    it("should handle different subAccount IDs", async () => {
      const customSubAccountTransaction = {
        ...mockTokenTransaction,
        subAccountId: "vechain:1:0x123:+customtoken",
      };

      const result = await buildOptimisticOperation(mockAccount, customSubAccountTransaction);

      expect(result.subOperations![0].accountId).toBe("vechain:1:0x123:+customtoken");
      expect(mockedEncodeOperationId).toHaveBeenCalledWith(
        "vechain:1:0x123:+customtoken",
        "",
        "OUT",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle transaction with null recipient", async () => {
      const nullRecipientTransaction = {
        ...mockVetTransaction,
        recipient: null as any,
      };

      const result = await buildOptimisticOperation(mockAccount, nullRecipientTransaction);

      expect(result.recipients).toEqual([]);
    });

    it("should handle transaction with undefined recipient", async () => {
      const undefinedRecipientTransaction = {
        ...mockVetTransaction,
        recipient: undefined as any,
      };

      const result = await buildOptimisticOperation(mockAccount, undefinedRecipientTransaction);

      expect(result.recipients).toEqual([]);
    });

    it("should handle different fresh addresses", async () => {
      const customAccount = {
        ...mockAccount,
        freshAddress: "0x999888777666555444333222111000aaabbbcccd",
      };

      const result = await buildOptimisticOperation(customAccount, mockVetTransaction);

      expect(result.senders).toEqual(["0x999888777666555444333222111000aaabbbcccd"]);
    });
  });
});
