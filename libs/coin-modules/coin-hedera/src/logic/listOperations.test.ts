import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { listOperations } from "./listOperations";
import { apiClient } from "../network/api";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import * as utils from "./utils";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

setupMockCryptoAssetsStore();
jest.mock("@ledgerhq/coin-framework/account/accountId");
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../network/api");
jest.mock("./utils");

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getMemoFromBase64 as jest.Mock).mockImplementation(memo =>
      memo ? `decoded-${memo}` : null,
    );
    (encodeOperationId as jest.Mock).mockImplementation(
      (accountId, hash, type) => `${accountId}-${hash}-${type}`,
    );
    (encodeTokenAccountId as jest.Mock).mockImplementation(
      (accountId, token) => `${accountId}-${token.id}`,
    );
  });

  it("should return empty arrays when no transactions are found", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const pagination: Pagination = {
      minHeight: 0,
      limit: 10,
      order: "asc",
    };

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      address,
      fetchAllPages: true,
      pagingToken: null,
      order: "asc",
      limit: 10,
    });
    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
  });

  it("should parse HBAR transfer transactions correctly", async () => {
    const address = "0.0.1234567";
    const mockCurrency = getMockedCurrency();
    const pagination: Pagination = {
      minHeight: 0,
      limit: 10,
      order: "desc",
    };

    const mockTransactions = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        memo_base64: "test-memo",
        token_transfers: [],
        transfers: [
          { account: address, amount: "-1000000" },
          { account: "0.0.67890", amount: "1000000" },
        ],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.tokenOperations).toEqual([]);

    expect(result.coinOperations).toMatchObject([
      {
        type: "OUT",
        value: expect.any(Object),
        hash: "hash1",
        fee: expect.any(Object),
        date: expect.any(Date),
        senders: [address],
        recipients: ["0.0.67890"],
        extra: {
          pagingToken: "1625097600.000000000",
          consensusTimestamp: "1625097600.000000000",
          memo: "decoded-test-memo",
        },
      },
    ]);
  });

  it("should parse token transfer transactions correctly", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const tokenId = "0.0.7890";
    const pagination: Pagination = {
      minHeight: 0,
      limit: 10,
      order: "desc",
    };

    const mockToken = {
      id: "token1",
      contractAddress: tokenId,
      standard: "hts",
      name: "Test Token",
      units: [{ name: "TT", code: "tt", magnitude: 6 }],
    };

    const mockTransactions = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [
          { token_id: tokenId, account: address, amount: "-1000" },
          { token_id: tokenId, account: "0.0.67890", amount: "1000" },
        ],
        transfers: [],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const findTokenByAddressInCurrencyMock = jest.fn().mockResolvedValue(mockToken);
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.tokenOperations).toHaveLength(1);

    expect(result.coinOperations).toMatchObject([
      {
        type: "FEES",
        fee: expect.any(Object),
      },
    ]);

    expect(result.tokenOperations).toMatchObject([
      {
        type: "OUT",
        value: expect.any(Object),
        hash: "hash1",
        contract: tokenId,
        standard: "hts",
        senders: [address],
        recipients: ["0.0.67890"],
        extra: {
          pagingToken: "1625097600.000000000",
          consensusTimestamp: "1625097600.000000000",
        },
      },
    ]);
  });

  it("should parse token associate transactions correctly", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const pagination: Pagination = {
      minHeight: 0,
      limit: 10,
      order: "desc",
    };

    const mockTransactions = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [],
        transfers: [{ account: address, amount: "-500000" }],
        name: "TOKENASSOCIATE",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.tokenOperations).toHaveLength(0);

    expect(result.coinOperations).toMatchObject([
      {
        type: "ASSOCIATE_TOKEN",
        value: expect.any(Object),
        hash: "hash1",
        fee: expect.any(Object),
        senders: [address],
        recipients: [],
        extra: {
          pagingToken: "1625097600.000000000",
          consensusTimestamp: "1625097600.000000000",
        },
      },
    ]);
  });

  it("should skip token operations when token is not found in cryptoassets", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const tokenId = "0.0.7890";
    const pagination: Pagination = {
      minHeight: 0,
      limit: 10,
      order: "desc",
    };

    const mockTransactions = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [
          { token_id: tokenId, account: address, amount: "-1000" },
          { token_id: tokenId, account: "0.0.67890", amount: "1000" },
        ],
        transfers: [],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const findTokenByAddressInCurrencyMock = jest.fn().mockResolvedValue(null);
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toHaveLength(0);
    expect(result.tokenOperations).toHaveLength(0);
  });

  it("should use pagination parameters correctly", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const pagination: Pagination = {
      minHeight: 0,
      limit: 20,
      order: "asc",
      lastPagingToken: "1625097500.000000000",
    };

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

    await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      address,
      fetchAllPages: true,
      pagingToken: "1625097500.000000000",
      order: "asc",
      limit: 20,
    });
  });

  it("should handle failed transactions", async () => {
    const address = "0.0.12345";
    const mockCurrency = getMockedCurrency();
    const pagination: Pagination = {
      minHeight: 0,
      limit: 10,
      order: "desc",
    };

    const mockTransactions = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "INVALID_SIGNATURE",
        memo_base64: null,
        token_transfers: [],
        transfers: [
          { account: address, amount: "-1000000" },
          { account: "0.0.67890", amount: "1000000" },
        ],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.coinOperations[0].hasFailed).toBe(true);
  });
});
