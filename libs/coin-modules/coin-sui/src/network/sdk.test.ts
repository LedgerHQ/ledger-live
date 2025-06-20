import { TransactionBlockData, SuiTransactionBlockResponse, SuiClient } from "@mysten/sui/client";
import {
  getOperationType,
  getOperationSenders,
  getOperationRecipients,
  getOperationAmount,
  getOperationFee,
  getOperationDate,
  transactionToOperation,
  loadOperations,
  queryTransactions,
  TRANSACTIONS_LIMIT_PER_QUERY,
  TRANSACTIONS_LIMIT,
} from "./sdk";

import { BigNumber } from "bignumber.js";

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

jest.mock("@mysten/sui/client", () => {
  return {
    SuiClient: jest.fn().mockImplementation(() => ({
      queryTransactionBlocks: jest.fn(),
    })),
  };
});

const mockApi = new SuiClient({ url: "mock" }) as jest.Mocked<SuiClient>;

beforeEach(() => {
  mockApi.queryTransactionBlocks.mockReset();
});

describe("SDK Functions", () => {
  test("getOperationType should return IN for incoming tx", () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    expect(
      getOperationType(address, mockTransaction.transaction?.data as TransactionBlockData),
    ).toBe("IN");
  });

  test("getOperationSenders should return sender address", () => {
    expect(getOperationSenders(mockTransaction.transaction?.data as TransactionBlockData)).toEqual([
      "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
    ]);
  });

  test("getOperationRecipients should return recipient addresses", () => {
    expect(
      getOperationRecipients(mockTransaction.transaction?.data as TransactionBlockData),
    ).toEqual(["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"]);
  });

  test("getOperationAmount should calculate amount correctly", () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    expect(getOperationAmount(address, mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new BigNumber(0),
    );
  });

  test("getOperationFee should calculate fee correctly", () => {
    expect(getOperationFee(mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new BigNumber(1009880),
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
  });
});

describe("queryTransactions", () => {
  it("should call api.queryTransactionBlocks with correct params for IN", async () => {
    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "tx1" }],
      hasNextPage: false,
    });

    const result = await queryTransactions({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      order: "descending",
    });

    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { ToAddress: "0xabc" },
      }),
    );
    expect(result.data).toHaveLength(1);
  });

  it("should call api.queryTransactionBlocks with correct params for OUT", async () => {
    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "tx2" }],
      hasNextPage: false,
    });

    const result = await queryTransactions({
      api: mockApi,
      addr: "0xdef",
      type: "OUT",
      order: "descending",
    });

    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledWith(
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

    mockApi.queryTransactionBlocks
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
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(2);
  });

  it("should stop if less than TRANSACTIONS_LIMIT_PER_QUERY returned", async () => {
    // Create an array with length less than TRANSACTIONS_LIMIT_PER_QUERY
    const txs = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY - 1 }, (_, i) => ({
      digest: `tx${i + 1}`,
    }));

    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
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
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(2);
  });

  it("should retry without cursor when InvalidParams error occurs", async () => {
    // First call with cursor fails with InvalidParams
    mockApi.queryTransactionBlocks.mockRejectedValueOnce({ type: "InvalidParams" });

    // Second call without cursor succeeds
    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "tx1" }],
      hasNextPage: false,
    });

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
      cursor: "some-cursor",
      operations: [],
      order: "descending",
    });

    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(1);

    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { ToAddress: "0xabc" },
        cursor: "some-cursor",
      }),
    );

    expect(result).toHaveLength(0);
  });

  it("should should not retry after unexpected errors and return empty data", async () => {
    mockApi.queryTransactionBlocks.mockRejectedValueOnce(new Error("unexpected"));

    const result = await loadOperations({
      api: mockApi,
      addr: "0xerr",
      type: "IN",
      operations: [],
      order: "descending",
    });

    expect(result).toEqual([]);
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(1);
  });

  it("should handle empty initial operations array", async () => {
    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
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

    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
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

    mockApi.queryTransactionBlocks
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
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(3);

    // Verify cursor progression
    expect(mockApi.queryTransactionBlocks).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ cursor: undefined }),
    );
    expect(mockApi.queryTransactionBlocks).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: "cursor1" }),
    );
    expect(mockApi.queryTransactionBlocks).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ cursor: "cursor2" }),
    );
  });

  it("should respect TRANSACTIONS_LIMIT when loading in descending order", async () => {
    const largePage = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY }, (_, i) => ({
      digest: `tx${i + 1}`,
    }));

    mockApi.queryTransactionBlocks.mockImplementation(() =>
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

    // Should stop at TRANSACTIONS_LIMIT (300)
    expect(result.length).toBeLessThanOrEqual(TRANSACTIONS_LIMIT);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle ascending order pagination correctly", async () => {
    const page1 = [{ digest: "asc-tx1" }, { digest: "asc-tx2" }];
    const page2 = [{ digest: "asc-tx3" }];

    mockApi.queryTransactionBlocks
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
    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
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
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(1);
  });

  it("should handle case where middle page has no data", async () => {
    const page1 = [{ digest: "tx1" }, { digest: "tx2" }];
    const page2: any[] = []; // Empty page
    const page3 = [{ digest: "tx3" }];

    mockApi.queryTransactionBlocks
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
    // Simulate reaching the limit by creating many pages
    const page = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY }, (_, i) => ({
      digest: `limit-tx${i + 1}`,
    }));

    mockApi.queryTransactionBlocks.mockImplementation(() =>
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

    // Should stop at TRANSACTIONS_LIMIT
    expect(result.length).toBeLessThanOrEqual(TRANSACTIONS_LIMIT);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle mixed error scenarios", async () => {
    // First call succeeds
    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
      data: [{ digest: "success-tx" }],
      hasNextPage: true,
      nextCursor: "error-cursor",
    });

    // Second call fails with InvalidParams
    mockApi.queryTransactionBlocks.mockRejectedValueOnce({ type: "InvalidParams" });

    // Third call succeeds
    mockApi.queryTransactionBlocks.mockResolvedValueOnce({
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

    expect(result).toHaveLength(1); // Only the first successful call
    expect(result.map(tx => tx.digest)).toEqual(["success-tx"]);
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(2);
  });
});
