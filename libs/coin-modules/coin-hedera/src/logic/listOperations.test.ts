import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { listOperations } from "./listOperations";
import { hederaMirrorNode } from "../network/mirror";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import * as utils from "./utils";

jest.mock("@ledgerhq/cryptoassets/tokens");
jest.mock("@ledgerhq/coin-framework/account/accountId");
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../network/mirror");
jest.mock("./utils");

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (utils.base64ToUrlSafeBase64 as jest.Mock).mockImplementation(hash => `safe-${hash}`);
    (utils.getMemoFromBase64 as jest.Mock).mockImplementation(memo => `decoded-${memo}`);
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

    (hederaMirrorNode.getAccountTransactions as jest.Mock).mockResolvedValue([]);

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
    });

    expect(hederaMirrorNode.getAccountTransactions).toHaveBeenCalledWith({
      address,
      since: null,
      order: "asc",
      limit: 10,
    });
    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
  });

  it("should parse HBAR transfer transactions correctly", async () => {
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
        memo_base64: "test-memo",
        token_transfers: [],
        transfers: [
          { account: address, amount: "-1000000" },
          { account: "0.0.67890", amount: "1000000" },
        ],
        name: "CRYPTOTRANSFER",
      },
    ];

    (hederaMirrorNode.getAccountTransactions as jest.Mock).mockResolvedValue(mockTransactions);

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.tokenOperations).toHaveLength(0);

    expect(result.coinOperations[0]).toMatchObject({
      type: "OUT",
      value: expect.any(Object),
      hash: "safe-hash1",
      fee: expect.any(Object),
      date: expect.any(Date),
      senders: [address],
      recipients: ["0.0.67890"],
      extra: {
        pagingToken: "1625097600.000000000",
        consensusTimestamp: "1625097600.000000000",
        memo: "decoded-test-memo",
      },
    });
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

    (hederaMirrorNode.getAccountTransactions as jest.Mock).mockResolvedValue(mockTransactions);
    (findTokenByAddressInCurrency as jest.Mock).mockReturnValue(mockToken);

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.tokenOperations).toHaveLength(1);

    expect(result.coinOperations[0]).toMatchObject({
      type: "FEES",
      fee: expect.any(Object),
    });

    expect(result.tokenOperations[0]).toMatchObject({
      type: "OUT",
      value: expect.any(Object),
      hash: "safe-hash1",
      contract: tokenId,
      standard: "hts",
      senders: [address],
      recipients: ["0.0.67890"],
      extra: {
        pagingToken: "1625097600.000000000",
        consensusTimestamp: "1625097600.000000000",
        memo: null,
      },
    });
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

    (hederaMirrorNode.getAccountTransactions as jest.Mock).mockResolvedValue(mockTransactions);

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.tokenOperations).toHaveLength(0);

    expect(result.coinOperations[0]).toMatchObject({
      type: "ASSOCIATE_TOKEN",
      value: expect.any(Object),
      hash: "safe-hash1",
      fee: expect.any(Object),
      senders: [address],
      recipients: [],
      extra: {
        pagingToken: "1625097600.000000000",
        consensusTimestamp: "1625097600.000000000",
        memo: null,
      },
    });
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

    (hederaMirrorNode.getAccountTransactions as jest.Mock).mockResolvedValue(mockTransactions);
    (findTokenByAddressInCurrency as jest.Mock).mockReturnValue(null);

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
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

    (hederaMirrorNode.getAccountTransactions as jest.Mock).mockResolvedValue([]);

    await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
    });

    expect(hederaMirrorNode.getAccountTransactions).toHaveBeenCalledWith({
      address,
      since: "1625097500.000000000",
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

    (hederaMirrorNode.getAccountTransactions as jest.Mock).mockResolvedValue(mockTransactions);

    const result = await listOperations({
      currency: mockCurrency,
      address,
      pagination,
      mirrorTokens: [],
    });

    expect(result.coinOperations[0].hasFailed).toBe(true);
  });
});
