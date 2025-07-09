import { TransactionBlockData, SuiTransactionBlockResponse, SuiClient } from "@mysten/sui/client";
import {
  getAccountBalances,
  getOperationType,
  getOperationSenders,
  getOperationRecipients,
  getOperationAmount,
  getOperationFee,
  getOperationDate,
  getOperationCoinType,
  transactionToOperation,
  loadOperations,
  queryTransactions,
  TRANSACTIONS_LIMIT_PER_QUERY,
  TRANSACTIONS_LIMIT,
  getOperations,
  paymentInfo,
  createTransaction,
  getCoinObjectId,
  executeTransactionBlock,
  DEFAULT_COIN_TYPE,
} from "./sdk";
import coinConfig from "../config";

import { BigNumber } from "bignumber.js";

// Mock SUI client for tests
jest.mock("@mysten/sui/client", () => {
  return {
    ...jest.requireActual("@mysten/sui/client"),
    SuiClient: jest.fn().mockImplementation(() => ({
      getAllBalances: jest.fn().mockResolvedValue([
        { coinType: "0x2::sui::SUI", totalBalance: "1000000000" },
        { coinType: "0x123::test::TOKEN", totalBalance: "500000" },
      ]),
      queryTransactionBlocks: jest.fn().mockResolvedValue({
        data: [],
        hasNextPage: false,
      }),
      dryRunTransactionBlock: jest.fn().mockResolvedValue({
        effects: {
          gasUsed: {
            computationCost: "1000000",
            storageCost: "500000",
            storageRebate: "450000",
          },
        },
        input: {
          gasData: {
            budget: "4000000",
          },
        },
      }),
      getCoins: jest.fn().mockResolvedValue({
        data: [{ coinObjectId: "0xtest_coin_object_id" }],
      }),
      executeTransactionBlock: jest.fn().mockResolvedValue({
        digest: "transaction_digest_123",
        effects: {
          status: { status: "success" },
        },
      }),
      getReferenceGasPrice: jest.fn().mockResolvedValue("1000"),
    })),
    getFullnodeUrl: jest.fn().mockReturnValue("https://mockapi.sui.io"),
  };
});

// Mock the Transaction class
jest.mock("@mysten/sui/transactions", () => {
  const mockTxb = {
    // This will be the built transaction block
    transactionBlock: new Uint8Array(),
  };

  return {
    ...jest.requireActual("@mysten/sui/transactions"),
    Transaction: jest.fn().mockImplementation(() => {
      return {
        gas: "0xmock_gas_object_id",
        setSender: jest.fn(),
        splitCoins: jest.fn().mockReturnValue(["0xmock_coin"]),
        transferObjects: jest.fn(),
        build: jest.fn().mockResolvedValue(mockTxb),
      };
    }),
  };
});

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
            digest: "2rPEonJQQUXeAmAegn3fVqBjpKrC5NadAZBetb5wJQm6",
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
    {
      owner: { AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0" },
      coinType: "0x123::test::TOKEN",
      amount: "500000",
    },
  ],
  timestampMs: "1742294454878",
  checkpoint: "313024",
};

const mockApi = new SuiClient({ url: "mock" }) as jest.Mocked<SuiClient>;

beforeAll(() => {
  coinConfig.setCoinConfig(() => ({
    status: {
      type: "active",
    },
    node: {
      url: "https://mockapi.sui.io",
    },
  }));
});

beforeEach(() => {
  mockApi.queryTransactionBlocks.mockReset();
});

describe("SDK Functions", () => {
  test("getAccountBalances should return array of account balances", async () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    const balances = await getAccountBalances(address);

    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);

    // Check structure of the first balance
    const firstBalance = balances[0];
    expect(firstBalance).toHaveProperty("coinType");
    expect(firstBalance).toHaveProperty("blockHeight");
    expect(firstBalance).toHaveProperty("balance");
    expect(firstBalance.balance).toBeInstanceOf(BigNumber);

    // Should include SUI and token balances
    const coinTypes = balances.map(b => b.coinType);
    expect(coinTypes).toContain(DEFAULT_COIN_TYPE);
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

  test("getOperationRecipients should return recipient addresses", () => {
    expect(
      getOperationRecipients(mockTransaction.transaction?.data as TransactionBlockData),
    ).toEqual(["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"]);
  });

  test("getOperationAmount should calculate amount correctly for SUI", () => {
    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    expect(
      getOperationAmount(
        address,
        mockTransaction as SuiTransactionBlockResponse,
        DEFAULT_COIN_TYPE,
      ),
    ).toEqual(new BigNumber("9998990120"));
  });

  test("getOperationAmount should calculate amount correctly for tokens", () => {
    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    expect(
      getOperationAmount(
        address,
        mockTransaction as SuiTransactionBlockResponse,
        "0x123::test::TOKEN",
      ),
    ).toEqual(new BigNumber("500000"));
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

  test("getOperationCoinType should extract token coin type", () => {
    // For a token transaction
    const tokenTx = {
      ...mockTransaction,
      balanceChanges: [
        {
          owner: {
            AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
          coinType: "0x123::test::TOKEN",
          amount: "500000",
        },
        {
          owner: {
            AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
          coinType: DEFAULT_COIN_TYPE,
          amount: "-1009880",
        },
      ],
    };

    expect(getOperationCoinType(tokenTx as SuiTransactionBlockResponse)).toBe("0x123::test::TOKEN");

    // For a SUI-only transaction
    const suiTx = {
      ...mockTransaction,
      balanceChanges: [
        {
          owner: {
            AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
          coinType: DEFAULT_COIN_TYPE,
          amount: "9998990120",
        },
      ],
    };

    expect(getOperationCoinType(suiTx as SuiTransactionBlockResponse)).toBe(DEFAULT_COIN_TYPE);
  });

  test("transactionToOperation should map transaction to operation", () => {
    const accountId = "mockAccountId";
    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";

    // Create a SUI-only transaction for this test to avoid token detection
    const suiTx = {
      ...mockTransaction,
      balanceChanges: [
        {
          owner: {
            AddressOwner: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
          },
          coinType: DEFAULT_COIN_TYPE,
          amount: "-10000000000",
        },
        {
          owner: {
            AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
          coinType: DEFAULT_COIN_TYPE,
          amount: "9998990120",
        },
      ],
    };

    // Instead of mocking, just directly verify the amount
    const operation = transactionToOperation(
      accountId,
      address,
      suiTx as SuiTransactionBlockResponse,
    );
    expect(operation).toHaveProperty("id");
    expect(operation).toHaveProperty("accountId", accountId);
    expect(operation).toHaveProperty("extra");
    expect((operation.extra as { coinType: string }).coinType).toBe(DEFAULT_COIN_TYPE);

    // Directly calculate expected amount for SUI coin type
    const expectedAmount = getOperationAmount(
      address,
      suiTx as SuiTransactionBlockResponse,
      DEFAULT_COIN_TYPE,
    );
    expect(expectedAmount.toString()).toBe("9998990120");
  });

  test("transactionToOperation should map token transaction to operation", () => {
    const accountId = "mockAccountId";
    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";

    // Create a token transaction
    const tokenTx = {
      ...mockTransaction,
      balanceChanges: [
        {
          owner: {
            AddressOwner: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
          },
          coinType: "0x123::test::TOKEN",
          amount: "-500000",
        },
        {
          owner: {
            AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
          coinType: "0x123::test::TOKEN",
          amount: "500000",
        },
        {
          owner: {
            AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
          coinType: DEFAULT_COIN_TYPE,
          amount: "-1000000",
        },
      ],
    };

    const operation = transactionToOperation(
      accountId,
      address,
      tokenTx as SuiTransactionBlockResponse,
    );
    expect(operation).toHaveProperty("id");
    expect(operation).toHaveProperty("accountId", accountId);
    expect(operation).toHaveProperty("extra");
    expect((operation.extra as { coinType: string }).coinType).toBe("0x123::test::TOKEN");
    expect(operation.value).toEqual(new BigNumber("500000"));
  });

  test("getOperations should fetch operations", async () => {
    const accountId = "mockAccountId";
    const addr = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    const operations = await getOperations(accountId, addr);
    expect(Array.isArray(operations)).toBe(true);
  });

  test("paymentInfo should return gas budget and fees", async () => {
    const sender = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    const fakeTransaction = {
      mode: "send" as const,
      coinType: DEFAULT_COIN_TYPE,
      family: "sui" as const,
      amount: new BigNumber(100),
      recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
      errors: {},
    };
    const info = await paymentInfo(sender, fakeTransaction);
    expect(info).toHaveProperty("gasBudget");
    expect(info).toHaveProperty("totalGasUsed");
    expect(info).toHaveProperty("fees");
  });

  test("getCoinObjectId should return object ID for token transactions", async () => {
    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    const transaction = {
      mode: "token.send" as const,
      coinType: "0x123::test::TOKEN",
      amount: new BigNumber(100),
      recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
    };

    const coinObjectId = await getCoinObjectId(address, transaction);
    expect(coinObjectId).toBe("0xtest_coin_object_id");
  });

  test("getCoinObjectId should return null for SUI transactions", async () => {
    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    const transaction = {
      mode: "send" as const,
      coinType: DEFAULT_COIN_TYPE,
      amount: new BigNumber(100),
      recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
    };

    const coinObjectId = await getCoinObjectId(address, transaction);
    expect(coinObjectId).toBeNull();
  });

  test("createTransaction should build a transaction", async () => {
    const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    const transaction = {
      mode: "send" as const,
      coinType: DEFAULT_COIN_TYPE,
      amount: new BigNumber(100),
      recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
    };

    const tx = await createTransaction(address, transaction);
    expect(tx).toBeDefined();
  });

  test("executeTransactionBlock should execute a transaction", async () => {
    const result = await executeTransactionBlock({
      transactionBlock: new Uint8Array(),
      signature: "mockSignature",
      options: { showEffects: true },
    });

    expect(result).toHaveProperty("digest", "transaction_digest_123");
    expect(result?.effects).toBeDefined();
    if (result?.effects) {
      expect(result.effects).toHaveProperty("status");
      expect(result.effects.status).toHaveProperty("status", "success");
    }
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
    });

    expect(result).toHaveLength(pageSize + 1);
    expect(result.map(tx => tx.digest)).toEqual([
      ...firstPage.map(tx => tx.digest),
      `tx${pageSize + 1}`,
    ]);
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
    });

    expect(result).toHaveLength(TRANSACTIONS_LIMIT_PER_QUERY - 1);
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(1);
  });

  it("should not exceed TRANSACTIONS_LIMIT", async () => {
    const page = Array.from({ length: TRANSACTIONS_LIMIT_PER_QUERY }, (_, i) => ({
      digest: `tx${i + 1}`,
    }));
    const expectedCalls = Math.ceil(TRANSACTIONS_LIMIT / TRANSACTIONS_LIMIT_PER_QUERY);

    mockApi.queryTransactionBlocks.mockImplementation(() =>
      Promise.resolve({
        data: page,
        hasNextPage: true,
        nextCursor: "cursor",
      }),
    );

    const result = await loadOperations({
      api: mockApi,
      addr: "0xabc",
      type: "IN",
    });

    expect(result).toHaveLength(TRANSACTIONS_LIMIT);
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(expectedCalls);
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
    });

    // Should have been called twice
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(2);

    // First call should have included the cursor
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { ToAddress: "0xabc" },
        cursor: "some-cursor",
      }),
    );

    // Second call should have cursor: null
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { ToAddress: "0xabc" },
        cursor: null,
      }),
    );

    // Result should be from the second call
    expect(result).toHaveLength(1);
    expect(result[0].digest).toBe("tx1");
  });

  it("should should not retry after unexpected errors and return empty data", async () => {
    mockApi.queryTransactionBlocks.mockRejectedValueOnce(new Error("unexpected"));

    const result = await loadOperations({
      api: mockApi,
      addr: "0xerr",
      type: "IN",
    });

    expect(result).toEqual([]);
    expect(mockApi.queryTransactionBlocks).toHaveBeenCalledTimes(1);
  });
});
