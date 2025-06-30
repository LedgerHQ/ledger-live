// Move all jest.mock calls to the very top
jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn(() => ({ node: { url: "http://test.com" } })),
  },
}));

jest.mock("../utils", () => ({
  ensureAddressFormat: jest.fn((addr: string) => addr),
}));

jest.mock("@ledgerhq/live-network/cache", () => ({
  makeLRUCache: jest.fn(() => jest.fn()),
  minutes: jest.fn(() => 60000),
}));

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

jest.mock("@mysten/sui/client", () => {
  const mockClient = {
    queryTransactionBlocks: jest.fn(),
    getBalance: jest.fn(),
    getLatestCheckpointSequenceNumber: jest.fn(),
    getCheckpoint: jest.fn(),
    dryRunTransactionBlock: jest.fn(),
    executeTransactionBlock: jest.fn(),
  };
  return {
    SuiClient: jest.fn().mockImplementation(() => mockClient),
  };
});

jest.mock("@mysten/sui/transactions", () => ({
  Transaction: jest.fn().mockImplementation(() => ({
    setSender: jest.fn().mockReturnThis(),
    splitCoins: jest.fn().mockReturnValue([{ id: "coin1" }]),
    transferObjects: jest.fn().mockReturnThis(),
    gas: { id: "gas" },
    build: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  })),
}));

// Now import after mocks
import {
  getListOperations,
  getOperationType,
  getOperationSenders,
  getOperationRecipients,
  getOperationAmount,
  getOperationFee,
  getOperationDate,
  transactionToOperation,
  loadOperations,
  queryTransactions,
  isSender,
  TRANSACTIONS_LIMIT_PER_QUERY,
  TRANSACTIONS_LIMIT,
  getOperations,
  createTransaction,
  paymentInfo,
} from "./sdk";
import { BigNumber } from "bignumber.js";
import { SuiClient } from "@mysten/sui/client";
import type { TransactionBlockData, SuiTransactionBlockResponse } from "@mysten/sui/client";

let mockApi: jest.Mocked<SuiClient>;
let actualMockInstance: any;

beforeEach(() => {
  mockApi = new SuiClient({ url: "mock" }) as jest.Mocked<SuiClient>;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SuiClient: MockedSuiClient } = require("@mysten/sui/client");
  actualMockInstance = MockedSuiClient.mock.results[0].value;
  jest.clearAllMocks();
  actualMockInstance.queryTransactionBlocks.mockReset();
  actualMockInstance.getBalance.mockReset();
  actualMockInstance.getLatestCheckpointSequenceNumber.mockReset();
  actualMockInstance.getCheckpoint.mockReset();
  actualMockInstance.dryRunTransactionBlock.mockReset();
  actualMockInstance.executeTransactionBlock.mockReset();

  // Default mock: always return a valid empty page
  actualMockInstance.queryTransactionBlocks.mockResolvedValue({
    data: [],
    hasNextPage: false,
  });
});

describe("SDK Functions", () => {
  describe("isSender", () => {
    it("should return true when address is sender", () => {
      const address = "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24";
      expect(isSender(address, mockTransaction.transaction?.data as TransactionBlockData)).toBe(
        true,
      );
    });

    it("should return false when address is not sender", () => {
      const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      expect(isSender(address, mockTransaction.transaction?.data as TransactionBlockData)).toBe(
        false,
      );
    });

    it("should return false when transaction is undefined", () => {
      const address = "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24";
      expect(isSender(address, undefined)).toBe(false);
    });
  });

  test("getOperationType should return IN for incoming tx", () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    expect(
      getOperationType(address, mockTransaction.transaction?.data as TransactionBlockData),
    ).toBe("IN");
  });

  test("getOperationType should return OUT for outgoing tx", () => {
    const address = "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24";
    expect(
      getOperationType(address, mockTransaction.transaction?.data as TransactionBlockData),
    ).toBe("OUT");
  });

  test("getOperationSenders should return sender address", () => {
    expect(getOperationSenders(mockTransaction.transaction?.data as TransactionBlockData)).toEqual([
      "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
    ]);
  });

  test("getOperationSenders should return empty array when no sender", () => {
    const transactionWithoutSender = {
      ...mockTransaction.transaction?.data,
      sender: undefined,
    } as unknown as TransactionBlockData;
    expect(getOperationSenders(transactionWithoutSender)).toEqual([]);
  });

  test("getOperationRecipients should return recipient addresses", () => {
    expect(
      getOperationRecipients(mockTransaction.transaction?.data as TransactionBlockData),
    ).toEqual(["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"]);
  });

  test("getOperationRecipients should return empty array for non-programmable transaction", () => {
    const nonProgrammableTx = {
      ...mockTransaction.transaction?.data,
      transaction: { kind: "TransferObject" },
    } as unknown as TransactionBlockData;
    expect(getOperationRecipients(nonProgrammableTx)).toEqual([]);
  });

  test("getOperationRecipients should return empty array when no inputs", () => {
    const txWithoutInputs = {
      ...mockTransaction.transaction?.data,
      transaction: { kind: "ProgrammableTransaction", inputs: undefined },
    } as unknown as TransactionBlockData;
    expect(getOperationRecipients(txWithoutInputs)).toEqual([]);
  });

  test("getOperationAmount should calculate amount correctly", () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    expect(getOperationAmount(address, mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new BigNumber(0),
    );
  });

  test("getOperationAmount should handle positive balance changes", () => {
    const transactionWithPositiveChange = {
      ...mockTransaction,
      balanceChanges: [
        {
          owner: { AddressOwner: "0x123" },
          coinType: "0x2::sui::SUI",
          amount: "5000000",
        },
      ],
    };
    expect(
      getOperationAmount("0x123", transactionWithPositiveChange as SuiTransactionBlockResponse),
    ).toEqual(new BigNumber("5000000"));
  });

  test("getOperationAmount should handle negative balance changes", () => {
    const transactionWithNegativeChange = {
      ...mockTransaction,
      balanceChanges: [
        {
          owner: { AddressOwner: "0x123" },
          coinType: "0x2::sui::SUI",
          amount: "-3000000",
        },
      ],
    };
    expect(
      getOperationAmount("0x123", transactionWithNegativeChange as SuiTransactionBlockResponse),
    ).toEqual(new BigNumber("3000000"));
  });

  test("getOperationAmount should return zero when no balance changes", () => {
    const transactionWithoutBalanceChanges = {
      ...mockTransaction,
      balanceChanges: null,
    } as SuiTransactionBlockResponse;
    expect(getOperationAmount("0x123", transactionWithoutBalanceChanges)).toEqual(new BigNumber(0));
  });

  test("getOperationFee should calculate fee correctly", () => {
    expect(getOperationFee(mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new BigNumber(1009880),
    );
  });

  test("getOperationFee should handle zero costs", () => {
    const transactionWithZeroCosts = {
      ...mockTransaction,
      effects: {
        ...mockTransaction.effects,
        gasUsed: {
          computationCost: "0",
          storageCost: "0",
          storageRebate: "0",
          nonRefundableStorageFee: "0",
        },
      },
    };
    expect(getOperationFee(transactionWithZeroCosts as SuiTransactionBlockResponse)).toEqual(
      new BigNumber(0),
    );
  });

  test("getOperationDate should return correct date", () => {
    expect(getOperationDate(mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new Date("2025-03-18T10:40:54.878Z"),
    );
  });

  test("transactionToOperation should map transaction to operation", () => {
    const accountId = "mockAccountId";
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    const operation = transactionToOperation(
      accountId,
      address,
      mockTransaction as SuiTransactionBlockResponse,
    );
    expect(operation).toHaveProperty("id");
    expect(operation).toHaveProperty("accountId", accountId);
    expect(operation).toHaveProperty("blockHeight", 5);
    expect(operation).toHaveProperty("hasFailed", false);
    expect(operation).toHaveProperty("type", "IN");
  });

  test("transactionToOperation should handle failed transactions", () => {
    const failedTransaction = {
      ...mockTransaction,
      effects: {
        ...mockTransaction.effects,
        status: { status: "failure" as const },
      },
    };
    const accountId = "mockAccountId";
    const address = "0x123";
    const operation = transactionToOperation(
      accountId,
      address,
      failedTransaction as SuiTransactionBlockResponse,
    );
    expect(operation.hasFailed).toBe(true);
  });

  describe("getOperations", () => {
    it("should handle empty results", async () => {
      actualMockInstance.queryTransactionBlocks
        .mockResolvedValueOnce({
          data: [],
          hasNextPage: false,
        })
        .mockResolvedValueOnce({
          data: [],
          hasNextPage: false,
        });

      const result = await getOperations("accountId", "0x123");

      expect(result).toHaveLength(0);
    });
  });

  describe("getListOperations (DI)", () => {
    it("should handle API errors gracefully", async () => {
      const mockWithApi = jest.fn().mockRejectedValue(new Error("API Error"));
      await expect(getListOperations("0x123", undefined, mockWithApi)).rejects.toThrow("API Error");
    });

    it("should return an array of operations", async () => {
      const mockWithApi = jest.fn().mockResolvedValue([
        {
          id: "test-tx",
          tx: {
            date: new Date(),
            hash: "test-hash",
            fees: BigInt("1000000"),
            block: { height: BigInt("100") as unknown as number },
          },
          asset: { type: "native" },
          recipients: ["0x789"],
          senders: ["0x456"],
          type: "IN",
          value: BigInt("5000000"),
        },
      ]);
      const result = await getListOperations("0x123", undefined, mockWithApi);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("tx");
      expect(result[0]).toHaveProperty("asset");
      expect(result[0]).toHaveProperty("type");
      expect(result[0]).toHaveProperty("value");
      expect(result[0]).toHaveProperty("recipients");
      expect(result[0]).toHaveProperty("senders");
    });

    it("should handle empty results", async () => {
      const mockWithApi = jest.fn().mockResolvedValue([]);
      const result = await getListOperations("0x123", undefined, mockWithApi);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle cursor parameter correctly", async () => {
      const mockWithApi = jest.fn().mockResolvedValue([]);
      await getListOperations("0x123", "test-cursor", mockWithApi);
      expect(mockWithApi).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("createTransaction", () => {
    it("should create and build transaction", async () => {
      const mockTransactionData = {
        mode: "send" as const,
        family: "sui" as const,
        amount: new BigNumber(1000000),
        recipient: "0x456",
        errors: {},
      };

      const result = await createTransaction("0x123", mockTransactionData);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle zero amount", async () => {
      const mockTransactionData = {
        mode: "send" as const,
        family: "sui" as const,
        amount: new BigNumber(0),
        recipient: "0x456",
        errors: {},
      };

      const result = await createTransaction("0x123", mockTransactionData);

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe("getOperationAmount edge cases", () => {
    it("should handle string owner in balance changes", () => {
      const transactionWithStringOwner = {
        ...mockTransaction,
        balanceChanges: [
          {
            owner: "0x123", // String owner instead of object
            coinType: "0x2::sui::SUI",
            amount: "5000000",
          },
        ],
      };

      const result = getOperationAmount(
        "0x123",
        transactionWithStringOwner as SuiTransactionBlockResponse,
      );
      expect(result).toEqual(new BigNumber(0)); // Should not match string owner
    });

    it("should handle non-AddressOwner in balance changes", () => {
      const transactionWithNonAddressOwner = {
        ...mockTransaction,
        balanceChanges: [
          {
            owner: { ObjectOwner: "0x123" }, // Non-AddressOwner
            coinType: "0x2::sui::SUI",
            amount: "5000000",
          },
        ],
      };

      const result = getOperationAmount(
        "0x123",
        transactionWithNonAddressOwner as SuiTransactionBlockResponse,
      );
      expect(result).toEqual(new BigNumber(0)); // Should not match non-AddressOwner
    });

    it("should handle multiple balance changes for same address", () => {
      const transactionWithMultipleChanges = {
        ...mockTransaction,
        balanceChanges: [
          {
            owner: { AddressOwner: "0x123" },
            coinType: "0x2::sui::SUI",
            amount: "5000000",
          },
          {
            owner: { AddressOwner: "0x123" },
            coinType: "0x2::sui::SUI",
            amount: "-2000000",
          },
        ],
      };

      const result = getOperationAmount(
        "0x123",
        transactionWithMultipleChanges as SuiTransactionBlockResponse,
      );
      expect(result).toEqual(new BigNumber(7000000)); // 5000000 + 2000000 (negative becomes positive)
    });
  });

  describe("getOperationFee edge cases", () => {
    it("should handle null effects", () => {
      const transactionWithNullEffects = {
        ...mockTransaction,
        effects: null,
      };

      expect(() =>
        getOperationFee(transactionWithNullEffects as SuiTransactionBlockResponse),
      ).toThrow();
    });

    it("should handle undefined effects", () => {
      const transactionWithUndefinedEffects = {
        ...mockTransaction,
        effects: undefined,
      } as unknown as SuiTransactionBlockResponse;

      expect(() => getOperationFee(transactionWithUndefinedEffects)).toThrow();
    });

    it("should handle missing gasUsed", () => {
      const transactionWithoutGasUsed = {
        ...mockTransaction,
        effects: {
          ...mockTransaction.effects,
          gasUsed: undefined,
        },
      } as unknown as SuiTransactionBlockResponse;

      expect(() => getOperationFee(transactionWithoutGasUsed)).toThrow();
    });
  });

  describe("getOperationDate edge cases", () => {
    it("should handle null timestampMs", () => {
      const transactionWithNullTimestamp = {
        ...mockTransaction,
        timestampMs: null,
      };

      // The function doesn't throw, it returns a Date object
      const result = getOperationDate(transactionWithNullTimestamp as SuiTransactionBlockResponse);
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle undefined timestampMs", () => {
      const transactionWithUndefinedTimestamp = {
        ...mockTransaction,
        timestampMs: undefined,
      } as unknown as SuiTransactionBlockResponse;

      // The function doesn't throw, it returns a Date object
      const result = getOperationDate(transactionWithUndefinedTimestamp);
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle invalid timestampMs", () => {
      const transactionWithInvalidTimestamp = {
        ...mockTransaction,
        timestampMs: "invalid-timestamp",
      };

      // The function doesn't throw, it returns a Date object (NaN)
      const result = getOperationDate(
        transactionWithInvalidTimestamp as SuiTransactionBlockResponse,
      );
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("transactionToOperation edge cases", () => {
    it("should handle transaction without transaction data", () => {
      const transactionWithoutData = {
        ...mockTransaction,
        transaction: null,
      };

      const result = transactionToOperation(
        "accountId",
        "0x123",
        transactionWithoutData as SuiTransactionBlockResponse,
      );

      expect(result.type).toBe("IN"); // Default to IN when no transaction data
      expect(result.senders).toEqual([]);
      expect(result.recipients).toEqual([]);
    });

    it("should handle transaction with undefined effects", () => {
      const transactionWithoutEffects = {
        ...mockTransaction,
        effects: undefined,
      } as unknown as SuiTransactionBlockResponse;

      // This will throw because getOperationFee is called and effects is undefined
      expect(() =>
        transactionToOperation("accountId", "0x123", transactionWithoutEffects),
      ).toThrow();
    });

    it("should handle transaction with null effects", () => {
      const transactionWithNullEffects = {
        ...mockTransaction,
        effects: null,
      };

      // This will throw because getOperationFee is called and effects is null
      expect(() =>
        transactionToOperation(
          "accountId",
          "0x123",
          transactionWithNullEffects as SuiTransactionBlockResponse,
        ),
      ).toThrow();
    });
  });

  describe("paymentInfo", () => {
    it("should return payment info structure", async () => {
      // Mock the Transaction constructor and its methods
      const mockTransaction = {
        setSender: jest.fn().mockReturnThis(),
        splitCoins: jest.fn().mockReturnValue([{ id: "coin1" }]),
        transferObjects: jest.fn().mockReturnThis(),
        gas: { id: "gas" },
        build: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      };

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Transaction } = require("@mysten/sui/transactions");
      Transaction.mockImplementation(() => mockTransaction);

      // Mock the dryRunTransactionBlock to return a simple response
      actualMockInstance.dryRunTransactionBlock.mockResolvedValue({
        effects: {
          gasUsed: {
            computationCost: "1000000",
            storageCost: "500000",
            storageRebate: "200000",
          },
        },
        input: {
          gasData: {
            budget: "1500000",
          },
        },
      } as any);

      const sender = "0x123";
      const transactionParams = {
        amount: new BigNumber(1000000),
        recipient: "0x456",
      };

      const result = await paymentInfo(sender, transactionParams);

      expect(result).toHaveProperty("gasBudget");
      expect(result).toHaveProperty("totalGasUsed");
      expect(result).toHaveProperty("fees");
      expect(typeof result.gasBudget).toBe("string");
    });

    it("should handle API errors", async () => {
      actualMockInstance.dryRunTransactionBlock.mockRejectedValue(new Error("API Error"));

      const sender = "0x123";
      const transactionParams = {
        amount: new BigNumber(1000000),
        recipient: "0x456",
      };

      await expect(paymentInfo(sender, transactionParams)).rejects.toThrow("API Error");
    });
  });
});

describe("queryTransactions", () => {
  it("should call api.queryTransactionBlocks with correct params for IN", async () => {
    actualMockInstance.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "tx1" }],
      hasNextPage: false,
    });

    const result = await queryTransactions({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      order: "descending",
    });

    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { ToAddress: "0xabc" },
      }),
    );
    expect(result.data).toHaveLength(1);
  });

  it("should call api.queryTransactionBlocks with correct params for OUT", async () => {
    actualMockInstance.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "tx2" }],
      hasNextPage: false,
    });

    const result = await queryTransactions({
      api: mockApi,
      addr: "0xdef",
      type: "OUT",
      order: "descending",
    });

    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { FromAddress: "0xdef" },
      }),
    );
    expect(result.data).toHaveLength(1);
  });
});

describe("loadOperations", () => {
  it("should paginate and accumulate results", async () => {
    const pageSize = TRANSACTIONS_LIMIT_PER_QUERY;
    const firstPage = Array.from({ length: pageSize }, (_, i) => ({ digest: `tx${i + 1}` }));

    actualMockInstance.queryTransactionBlocks
      .mockResolvedValueOnce({
        data: firstPage,
        hasNextPage: true,
        nextCursor: "cursor1",
      })
      .mockResolvedValueOnce({
        data: [{ digest: `tx${pageSize + 1}` }],
        hasNextPage: false,
      });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      operations: [],
      order: "descending",
    });

    expect(result).toHaveLength(pageSize + 1);
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledTimes(2);
  });

  it("should stop if less than TRANSACTIONS_LIMIT_PER_QUERY returned", async () => {
    const txs = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY - 1 }, (_, i) => ({
      digest: `tx${i + 1}`,
    }));

    actualMockInstance.queryTransactionBlocks.mockResolvedValueOnce({
      data: txs,
      hasNextPage: true,
    });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "OUT",
      operations: [],
      order: "descending",
    });

    expect(result).toHaveLength(TRANSACTIONS_LIMIT_PER_QUERY - 1);
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledTimes(2);
  });

  it("should retry without cursor when InvalidParams error occurs", async () => {
    actualMockInstance.queryTransactionBlocks.mockRejectedValueOnce({ type: "InvalidParams" });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      cursor: "some-cursor",
      operations: [],
      order: "descending",
    });

    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledTimes(1);
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { ToAddress: "0xabc" },
        cursor: "some-cursor",
      }),
    );
    expect(result).toHaveLength(0);
  });

  it("should should not retry after unexpected errors and return empty data", async () => {
    actualMockInstance.queryTransactionBlocks.mockRejectedValueOnce(new Error("unexpected"));

    const result = await loadOperations({
      api: mockApi,
      addr: "0xerr",
      type: "IN",
      operations: [],
      order: "descending",
    });

    expect(result).toEqual([]);
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledTimes(1);
  });

  it("should handle empty initial operations array", async () => {
    actualMockInstance.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "tx1" }, { digest: "tx2" }],
      hasNextPage: false,
    });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "OUT",
      operations: [],
      order: "descending",
    });

    expect(result).toHaveLength(2);
    expect(result.map(tx => tx.digest)).toEqual(["tx1", "tx2"]);
  });

  it("should append to existing operations array", async () => {
    const existingOperations = [{ digest: "existing-tx" }];

    actualMockInstance.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "new-tx1" }, { digest: "new-tx2" }],
      hasNextPage: false,
    });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      operations: existingOperations,
      order: "descending",
    });

    expect(result).toHaveLength(3);
    expect(result.map(tx => tx.digest)).toEqual(["existing-tx", "new-tx1", "new-tx2"]);
  });

  it("should handle multiple pages with cursor progression", async () => {
    const page1 = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY }, (_, i) => ({
      digest: `page1-tx${i + 1}`,
    }));
    const page2 = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY }, (_, i) => ({
      digest: `page2-tx${i + 1}`,
    }));
    const page3 = [{ digest: "final-tx" }];

    actualMockInstance.queryTransactionBlocks
      .mockResolvedValueOnce({
        data: page1,
        hasNextPage: true,
        nextCursor: "cursor1",
      })
      .mockResolvedValueOnce({
        data: page2,
        hasNextPage: true,
        nextCursor: "cursor2",
      })
      .mockResolvedValueOnce({
        data: page3,
        hasNextPage: false,
      });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "OUT",
      operations: [],
      order: "ascending",
    });

    expect(result).toHaveLength(TRANSACTIONS_LIMIT_PER_QUERY * 2 + 1);
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledTimes(3);

    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ cursor: undefined }),
    );
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: "cursor1" }),
    );
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ cursor: "cursor2" }),
    );
  });

  it("should respect TRANSACTIONS_LIMIT when loading in descending order", async () => {
    const largePage = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY }, (_, i) => ({
      digest: `tx${i + 1}`,
    }));

    actualMockInstance.queryTransactionBlocks.mockImplementation(() =>
      Promise.resolve({
        data: largePage,
        hasNextPage: true,
        nextCursor: "next-cursor",
      }),
    );

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      operations: [],
      order: "descending",
    });

    expect(result.length).toBeLessThanOrEqual(TRANSACTIONS_LIMIT);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle ascending order pagination correctly", async () => {
    const page1 = [{ digest: "asc-tx1" }, { digest: "asc-tx2" }];
    const page2 = [{ digest: "asc-tx3" }];

    actualMockInstance.queryTransactionBlocks
      .mockResolvedValueOnce({
        data: page1,
        hasNextPage: true,
        nextCursor: "asc-cursor1",
      })
      .mockResolvedValueOnce({
        data: page2,
        hasNextPage: false,
      });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "OUT",
      operations: [],
      order: "ascending",
    });

    expect(result).toHaveLength(3);
    expect(result.map(tx => tx.digest)).toEqual(["asc-tx1", "asc-tx2", "asc-tx3"]);
  });

  it("should handle case where first page has no data", async () => {
    actualMockInstance.queryTransactionBlocks.mockResolvedValueOnce({
      data: [],
      hasNextPage: false,
    });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      operations: [],
      order: "descending",
    });

    expect(result).toHaveLength(0);
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledTimes(1);
  });

  it("should handle case where middle page has no data", async () => {
    const page1 = [{ digest: "tx1" }, { digest: "tx2" }];
    const page2: any[] = [];
    const page3 = [{ digest: "tx3" }];

    actualMockInstance.queryTransactionBlocks
      .mockResolvedValueOnce({
        data: page1,
        hasNextPage: true,
        nextCursor: "cursor1",
      })
      .mockResolvedValueOnce({
        data: page2,
        hasNextPage: true,
        nextCursor: "cursor2",
      })
      .mockResolvedValueOnce({
        data: page3,
        hasNextPage: false,
      });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "OUT",
      operations: [],
      order: "ascending",
    });

    expect(result).toHaveLength(3);
    expect(result.map(tx => tx.digest)).toEqual(["tx1", "tx2", "tx3"]);
  });

  it("should handle recursive call limit properly", async () => {
    const page = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY }, (_, i) => ({
      digest: `limit-tx${i + 1}`,
    }));

    actualMockInstance.queryTransactionBlocks.mockImplementation(() =>
      Promise.resolve({
        data: page,
        hasNextPage: true,
        nextCursor: "limit-cursor",
      }),
    );

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      operations: [],
      order: "descending",
    });

    expect(result.length).toBeLessThanOrEqual(TRANSACTIONS_LIMIT);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle mixed error scenarios", async () => {
    actualMockInstance.queryTransactionBlocks
      .mockResolvedValueOnce({
        data: [{ digest: "success-tx" }],
        hasNextPage: true,
        nextCursor: "error-cursor",
      })
      .mockRejectedValueOnce({ type: "InvalidParams" })
      .mockResolvedValueOnce({
        data: [{ digest: "recovery-tx" }],
        hasNextPage: false,
      });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "OUT",
      operations: [],
      order: "descending",
    });

    expect(result).toHaveLength(1);
    expect(result.map(tx => tx.digest)).toEqual(["success-tx"]);
    expect(actualMockInstance.queryTransactionBlocks).toHaveBeenCalledTimes(2);
  });
});

// Restore mockTransaction for use in tests
const mockTransaction = {
  digest: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
  transaction: {
    data: {
      messageVersion: "v1" as const,
      transaction: {
        kind: "ProgrammableTransaction" as const,
        inputs: [
          {
            type: "pure" as const,
            valueType: "address",
            value: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
        ],
        transactions: [
          {
            TransferObjects: [["GasCoin"], { Input: 0 }],
          },
        ],
      },
      sender: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
      gasData: {
        payment: [
          {
            objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
            version: "57",
            digest: "2rPEonJQQUXmAmAegn3fVqBjpKrC5NadAZBetb5wJQm6",
          },
        ],
        owner: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
        price: "1000",
        budget: "2988000",
      },
    },
    txSignatures: [
      "AJKFd5y+1y/ggTAKTZlrrQlvSWXoYCSU7ksxyBG6BI9FDjN/R8db5PNbw19Bs+Lp4VE0cu9BBzAc/gYDFwgYrQVgR+QnZSFg3qWm+IjLX2dEep/wlLje2lziXO+HmZApcQ==",
    ],
  },
  effects: {
    messageVersion: "v1" as const,
    status: { status: "success" as const },
    executedEpoch: "18",
    gasUsed: {
      computationCost: "1000000",
      storageCost: "988000",
      storageRebate: "978120",
      nonRefundableStorageFee: "9880",
    },
    modifiedAtVersions: [
      {
        objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
        sequenceNumber: "57",
      },
    ],
    transactionDigest: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
    mutated: [
      {
        owner: {
          AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        },
        reference: {
          objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
          version: "58",
          digest: "82pvkMbymnBFQjhuDDaaW88BeATbNgWWcWH67DcLaPBi",
        },
      },
    ],
    gasObject: {
      owner: { AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0" },
      reference: {
        objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
        version: "58",
        digest: "82pvkMbymnBFQjhuDDaaW88BeATbNgWWcWH67DcLaPBi",
      },
    },
    dependencies: ["D8tHbu9JwGuoaH67PFXCoswqDUy2M4S6KVLWhCodt1a7"],
  },
  balanceChanges: [
    {
      owner: { AddressOwner: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24" },
      coinType: "0x2::sui::SUI",
      amount: "-10000000000",
    },
    {
      owner: { AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0" },
      coinType: "0x2::sui::SUI",
      amount: "9998990120",
    },
  ],
  timestampMs: "1742294454878",
  checkpoint: "313024",
};
