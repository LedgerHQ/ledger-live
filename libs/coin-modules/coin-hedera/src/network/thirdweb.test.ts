import { pad } from "viem";
import network from "@ledgerhq/live-network";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { apiClient } from "./api";
import { getMockResponse } from "../test/fixtures/common.fixture";
import { getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import { thirdwebClient } from "./thirdweb";
import * as networkUtils from "./utils";
import { ERC20_TRANSFER_EVENT_TOPIC } from "../constants";

jest.mock("@ledgerhq/live-network");
jest.mock("./api");

const mockedNetwork = jest.mocked(network);
const mockedERC20Transaction = getMockedThirdwebTransaction();
const mockedTopic0Address = pad("0x0000000000000000000000000000000000000000");
const mockedTopic1Address = pad("0x0000000000000000000000000000000000000003");
const mockedERC20Token1 = getMockedERC20TokenCurrency({
  contractAddress: "0x0000000000000000000000000000000000000001",
});
const mockedERC20Token2 = getMockedERC20TokenCurrency({
  contractAddress: "0x0000000000000000000000000000000000000002",
});

describe("fetchERC20Transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include 'page', 'limit=1000' and filterTopic query params", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: {
          events: [],
          pagination: { limit: 1000, page: 1, totalCount: 0 },
        },
      }),
    );

    const params = {
      limit: "1000",
      page: "1",
      filterTopic0: mockedTopic0Address,
      filterTopic1: mockedTopic1Address,
    };

    await thirdwebClient.fetchERC20Transactions({
      contractAddress: mockedERC20Token1.contractAddress,
      options: params,
      fetchAllPages: true,
    });

    const requestUrl = mockedNetwork.mock.calls[0][0].url;
    expect(requestUrl).toContain(`page=${params.page}`);
    expect(requestUrl).toContain(`limit=${params.limit}`);
    expect(requestUrl).toContain(`filterTopic0=${params.filterTopic0}`);
    expect(requestUrl).toContain(`filterTopic1=${params.filterTopic1}`);
  });

  it("should fire only once and return single element", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: {
          events: [mockedERC20Transaction],
          pagination: { limit: 1000, page: 1, totalCount: 1 },
        },
      }),
    );

    const params = {
      limit: "1000",
      page: "1",
      filterTopic0: mockedTopic0Address,
      filterTopic1: mockedTopic1Address,
    };
    const result = await thirdwebClient.fetchERC20Transactions({
      contractAddress: mockedERC20Token1.contractAddress,
      options: params,
      fetchAllPages: true,
    });

    expect(result).toHaveLength(1);
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should fire only once and return empty array", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: {
          events: [],
          pagination: { limit: 1000, page: 1, totalCount: 0 },
        },
      }),
    );

    const params = {
      limit: "1000",
      page: "1",
      filterTopic0: mockedTopic0Address,
      filterTopic1: mockedTopic1Address,
    };
    const result = await thirdwebClient.fetchERC20Transactions({
      contractAddress: mockedERC20Token1.contractAddress,
      options: params,
      fetchAllPages: true,
    });

    expect(result).toEqual([]);
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should keep fetching until returned events are fewer than requested limit", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          result: {
            events: [mockedERC20Transaction, mockedERC20Transaction],
            pagination: { limit: 2, page: 1, totalCount: 2 },
          },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          result: {
            events: [mockedERC20Transaction, mockedERC20Transaction],
            pagination: { limit: 2, page: 2, totalCount: 2 },
          },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          result: {
            events: [mockedERC20Transaction],
            pagination: { limit: 2, page: 3, totalCount: 2 },
          },
        }),
      );

    const params = {
      limit: "2",
      filterTopic0: mockedTopic0Address,
      filterTopic1: mockedTopic1Address,
    };
    const result = await thirdwebClient.fetchERC20Transactions({
      contractAddress: mockedERC20Token1.contractAddress,
      options: params,
      fetchAllPages: true,
    });

    expect(result).toHaveLength(5);
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });
});

describe("getERC20TransactionsForAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (apiClient.getAccount as jest.Mock).mockImplementation(address => ({
      address,
      evm_address: `0x${address}`,
    }));

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockImplementation(address => {
        if (address === mockedERC20Token1.contractAddress) return mockedERC20Token1;
        if (address === mockedERC20Token2.contractAddress) return mockedERC20Token2;

        return null;
      }),
    });
  });

  it("should return empty array without balance tokens list", async () => {
    jest.spyOn(networkUtils, "getERC20Operations").mockResolvedValue([]);

    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [],
      to: null,
    });

    expect(result).toEqual([]);
  });

  it("should return exactly 2 transactions (out & in)", async () => {
    const mockFetcher = jest.fn().mockResolvedValue([mockedERC20Transaction]);

    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [mockedERC20Token1.contractAddress],
      to: null,
      transactionFetcher: mockFetcher,
    });

    expect(result).toHaveLength(2);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });

  it("should return exactly 4 transactions total for 2 tokens (out & in)", async () => {
    jest.spyOn(networkUtils, "getERC20Operations").mockResolvedValue([]);
    const mockFetcher = jest.fn().mockResolvedValue([mockedERC20Transaction]);

    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [mockedERC20Token1.contractAddress, mockedERC20Token2.contractAddress],
      to: null,
      transactionFetcher: mockFetcher,
    });

    expect(result).toHaveLength(4);
    expect(mockFetcher).toHaveBeenCalledTimes(4);
  });

  it("should return exactly 4 transactions for single token (out & in)", async () => {
    jest.spyOn(networkUtils, "getERC20Operations").mockResolvedValue([]);
    const mockFetcher = jest
      .fn()
      .mockResolvedValue([mockedERC20Transaction, mockedERC20Transaction]);

    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [mockedERC20Token1.contractAddress],
      to: null,
      transactionFetcher: mockFetcher,
    });

    expect(result).toHaveLength(4);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });
});

describe("getTransactionsByTimestampRange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array with no contract addresses", async () => {
    const result = await thirdwebClient.getTransactionsByTimestampRange({
      contractAddresses: [],
      startTimestamp: "1000000",
      endTimestamp: "2000000",
    });

    expect(result).toEqual([]);
    expect(mockedNetwork).not.toHaveBeenCalled();
  });

  it("should fetch transactions for single contract with timestamp range", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: {
          events: [mockedERC20Transaction],
          pagination: { limit: 100, page: 1, totalCount: 1 },
        },
      }),
    );

    const result = await thirdwebClient.getTransactionsByTimestampRange({
      contractAddresses: [mockedERC20Token1.contractAddress],
      startTimestamp: "1000000",
      endTimestamp: "2000000",
    });

    expect(result).toHaveLength(1);
    expect(mockedNetwork).toHaveBeenCalledTimes(1);

    const requestUrl = mockedNetwork.mock.calls[0][0].url;
    expect(requestUrl).toContain("filterBlockTimestampGte=1000000");
    expect(requestUrl).toContain("filterBlockTimestampLte=2000000");
    expect(requestUrl).toContain(`filterTopic0=${ERC20_TRANSFER_EVENT_TOPIC}`);
  });

  it("should fetch and combine transactions from multiple contracts", async () => {
    const transaction1 = { ...mockedERC20Transaction, blockTimestamp: 1500000 };
    const transaction2 = { ...mockedERC20Transaction, blockTimestamp: 1600000 };

    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          result: {
            events: [transaction1],
            pagination: { limit: 100, page: 1, totalCount: 1 },
          },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          result: {
            events: [transaction2],
            pagination: { limit: 100, page: 1, totalCount: 1 },
          },
        }),
      );

    const result = await thirdwebClient.getTransactionsByTimestampRange({
      contractAddresses: [mockedERC20Token1.contractAddress, mockedERC20Token2.contractAddress],
      startTimestamp: "1000000",
      endTimestamp: "2000000",
    });

    expect(result).toHaveLength(2);
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });

  it("should sort transactions by timestamp in descending order", async () => {
    const transaction1 = {
      ...mockedERC20Transaction,
      blockTimestamp: 1500000,
      transactionIndex: 0,
    };
    const transaction2 = {
      ...mockedERC20Transaction,
      blockTimestamp: 1600000,
      transactionIndex: 0,
    };
    const transaction3 = {
      ...mockedERC20Transaction,
      blockTimestamp: 1400000,
      transactionIndex: 0,
    };

    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: {
          events: [transaction1, transaction2, transaction3],
          pagination: { limit: 100, page: 1, totalCount: 3 },
        },
      }),
    );

    const result = await thirdwebClient.getTransactionsByTimestampRange({
      contractAddresses: [mockedERC20Token1.contractAddress],
      startTimestamp: "1000000",
      endTimestamp: "2000000",
    });

    expect(result).toHaveLength(3);
    expect(result[0].blockTimestamp).toBe(1600000);
    expect(result[1].blockTimestamp).toBe(1500000);
    expect(result[2].blockTimestamp).toBe(1400000);
  });

  it("should sort by transaction index when timestamps are equal", async () => {
    const transaction1 = {
      ...mockedERC20Transaction,
      blockTimestamp: 1500000,
      transactionIndex: 2,
    };
    const transaction2 = {
      ...mockedERC20Transaction,
      blockTimestamp: 1500000,
      transactionIndex: 5,
    };
    const transaction3 = {
      ...mockedERC20Transaction,
      blockTimestamp: 1500000,
      transactionIndex: 1,
    };

    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: {
          events: [transaction1, transaction2, transaction3],
          pagination: { limit: 100, page: 1, totalCount: 3 },
        },
      }),
    );

    const result = await thirdwebClient.getTransactionsByTimestampRange({
      contractAddresses: [mockedERC20Token1.contractAddress],
      startTimestamp: "1000000",
      endTimestamp: "2000000",
    });

    expect(result).toHaveLength(3);
    expect(result[0].transactionIndex).toBe(5);
    expect(result[1].transactionIndex).toBe(2);
    expect(result[2].transactionIndex).toBe(1);
  });
});
