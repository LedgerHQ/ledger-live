import { pad } from "viem";
import network from "@ledgerhq/live-network";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import { getMockResponse } from "../test/fixtures/common.fixture";
import { thirdwebClient } from "./thirdweb";

jest.mock("@ledgerhq/live-network");
const mockedNetwork = jest.mocked(network);

const mockedERC20Transaction = getMockedThirdwebTransaction();
const mockedERC20TokenAddress1 = "0x0000000000000000000000000000000000000001";
const mockedERC20TokenAddress2 = "0x0000000000000000000000000000000000000002";
const mockedTopic0Address = pad("0x0000000000000000000000000000000000000000");
const mockedTopic1Address = pad("0x0000000000000000000000000000000000000003");

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

    await thirdwebClient.fetchERC20Transactions(mockedERC20TokenAddress1, params);

    const requestUrl = mockedNetwork.mock.calls[0][0].url;
    expect(requestUrl).toContain("page=1");
    expect(requestUrl).toContain("limit=1000");
    expect(requestUrl).toContain(`filterTopic0=${mockedTopic0Address}`);
    expect(requestUrl).toContain(`filterTopic1=${mockedTopic1Address}`);
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
    const result = await thirdwebClient.fetchERC20Transactions(mockedERC20TokenAddress1, params);

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
    const result = await thirdwebClient.fetchERC20Transactions(mockedERC20TokenAddress1, params);

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
    const result = await thirdwebClient.fetchERC20Transactions(mockedERC20TokenAddress1, params);

    expect(result).toHaveLength(5);
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });
});

describe("getERC20TransactionsForAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array without balance tokens list", async () => {
    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [],
      since: null,
    });

    expect(result).toEqual([]);
  });

  it("should return exactly 2 transactions (out & in)", async () => {
    const mockFetcher = jest.fn().mockResolvedValue([mockedERC20Transaction]);

    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [mockedERC20TokenAddress1],
      since: null,
      transactionFetcher: mockFetcher,
    });

    expect(result).toHaveLength(2);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });

  it("should return exactly 4 transactions total for 2 tokens (out & in)", async () => {
    const mockFetcher = jest.fn().mockResolvedValue([mockedERC20Transaction]);

    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [mockedERC20TokenAddress1, mockedERC20TokenAddress2],
      since: null,
      transactionFetcher: mockFetcher,
    });

    expect(result).toHaveLength(4);
    expect(mockFetcher).toHaveBeenCalledTimes(4);
  });

  it("should return exactly 4 transactions for single token (out & in)", async () => {
    const mockFetcher = jest
      .fn()
      .mockResolvedValue([mockedERC20Transaction, mockedERC20Transaction]);

    const result = await thirdwebClient.getERC20TransactionsForAccount({
      address: "0.0.1234",
      contractAddresses: [mockedERC20TokenAddress1],
      since: null,
      transactionFetcher: mockFetcher,
    });

    expect(result).toHaveLength(4);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });
});
