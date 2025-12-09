import BigNumber from "bignumber.js";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { getEnv } from "@ledgerhq/live-env";
import { listOperations } from "./listOperations";
import { apiClient } from "../network/api";
import { thirdwebClient } from "../network/thirdweb";
import * as networkUtils from "../network/utils";
import { getMockERC20Operation } from "../test/fixtures/common.fixture";
import {
  getMockedCurrency,
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import {
  createMirrorCoinTransfer,
  createMirrorTokenTransfer,
  getMockedMirrorTransaction,
} from "../test/fixtures/mirror.fixture";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import * as utils from "./utils";

setupMockCryptoAssetsStore();

jest.mock("@ledgerhq/coin-framework/account/accountId");
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../network/api");
jest.mock("../network/thirdweb");

describe("listOperations", () => {
  const mockTokenHTS = getMockedHTSTokenCurrency({ id: "token1", contractAddress: "0.0.7890" });
  const mockTokenERC20 = getMockedERC20TokenCurrency({ contractAddress: "0x1234567890abcdef" });
  const mockCurrency = getMockedCurrency();
  const mockAddress = "0.0.12345";
  const mockPagination: Pagination = {
    minHeight: 0,
    limit: 10,
    order: "desc",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (thirdwebClient.getERC20TransactionsForAccount as jest.Mock).mockResolvedValue([]);

    (encodeOperationId as jest.Mock).mockImplementation(
      (accountId, hash, type) => `${accountId}-${hash}-${type}`,
    );
    (encodeTokenAccountId as jest.Mock).mockImplementation(
      (accountId, token) => `${accountId}-${token.id}`,
    );

    jest.spyOn(utils, "toEVMAddress").mockImplementation(async address => `evm-${address}`);
    jest.spyOn(networkUtils, "getERC20Operations").mockResolvedValue([]);
    jest
      .spyOn(utils, "getMemoFromBase64")
      .mockImplementation(memo => (memo ? `decoded-${memo}` : null));
  });

  it("should return empty arrays when no transactions are found", async () => {
    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      address: mockAddress,
      fetchAllPages: true,
      pagingToken: null,
      order: mockPagination.order,
      limit: mockPagination.limit,
    });
    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
  });

  it("should parse HBAR transfer transactions correctly", async () => {
    const mockTransactions = [
      getMockedMirrorTransaction({
        memo_base64: "test-memo",
        transfers: [
          createMirrorCoinTransfer(mockAddress, -1000000),
          createMirrorCoinTransfer("0.0.67890", 1000000),
        ],
      }),
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([]);
    expect(result.coinOperations).toHaveLength(1);
    expect(result.coinOperations).toMatchObject([
      {
        type: "OUT",
        value: expect.any(BigNumber),
        hash: "hash1",
        fee: expect.any(BigNumber),
        date: expect.any(Date),
        senders: [mockAddress],
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
    const mockTransactions = [
      getMockedMirrorTransaction({
        token_transfers: [
          createMirrorTokenTransfer(mockAddress, -1000, mockTokenHTS.contractAddress),
          createMirrorTokenTransfer("0.0.67890", 1000, mockTokenHTS.contractAddress),
        ],
        transfers: [],
      }),
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const findTokenByAddressInCurrencyMock = jest.fn().mockResolvedValue(mockTokenHTS);
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: findTokenByAddressInCurrencyMock,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result).toMatchObject({
      coinOperations: [{ type: "FEES", fee: expect.any(BigNumber) }],
      tokenOperations: [
        {
          type: "OUT",
          value: expect.any(BigNumber),
          hash: "hash1",
          contract: mockTokenHTS.contractAddress,
          standard: "hts",
          senders: [mockAddress],
          recipients: ["0.0.67890"],
          extra: {
            pagingToken: "1625097600.000000000",
            consensusTimestamp: "1625097600.000000000",
          },
        },
      ],
    });
  });

  it("should parse token associate transactions correctly", async () => {
    const mockTransactions = [
      getMockedMirrorTransaction({
        name: "TOKENASSOCIATE",
        transfers: [createMirrorCoinTransfer(mockAddress, -500000)],
      }),
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result).toMatchObject({
      tokenOperations: [],
      coinOperations: [
        {
          type: "ASSOCIATE_TOKEN",
          hash: "hash1",
          value: expect.any(BigNumber),
          fee: expect.any(BigNumber),
          senders: [mockAddress],
          recipients: [],
          extra: {
            pagingToken: "1625097600.000000000",
            consensusTimestamp: "1625097600.000000000",
          },
        },
      ],
    });
  });

  it("should skip token operations when token is not found in cryptoassets", async () => {
    const mockTransactions = [
      getMockedMirrorTransaction({
        token_transfers: [
          createMirrorTokenTransfer(mockAddress, -1000, mockTokenHTS.contractAddress),
          createMirrorTokenTransfer("0.0.67890", 1000, mockTokenHTS.contractAddress),
        ],
        transfers: [],
      }),
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
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result).toMatchObject({
      coinOperations: [],
      tokenOperations: [],
    });
  });

  it("should use pagination parameters correctly", async () => {
    const pagination: Pagination = {
      minHeight: 0,
      limit: 20,
      order: "asc",
      lastPagingToken: "1625097500.000000000",
    };

    await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      address: mockAddress,
      fetchAllPages: true,
      pagingToken: "1625097500.000000000",
      order: "asc",
      limit: 20,
    });
  });

  it("should handle failed transactions", async () => {
    const mockTransactions = [
      getMockedMirrorTransaction({
        result: "INVALID_SIGNATURE",
        transfers: [
          createMirrorCoinTransfer(mockAddress, -1000000),
          createMirrorCoinTransfer("0.0.67890", 1000000),
        ],
      }),
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toMatchObject([{ hasFailed: true }]);
  });

  it("should create REWARD operation when staking rewards are present", async () => {
    const mockTransaction = getMockedMirrorTransaction({
      staking_reward_transfers: [{ account: mockAddress, amount: 1000000 }],
      transfers: [createMirrorCoinTransfer(mockAddress, -500000)],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    const rewardTimestamp = result.coinOperations[0].date.getTime();
    const mainTimestamp = result.coinOperations[1].date.getTime();

    expect(result.tokenOperations).toEqual([]);
    expect(rewardTimestamp).toBe(mainTimestamp + 1);
    expect(result.coinOperations).toMatchObject([
      {
        type: "REWARD",
        hash: `${mockTransaction.transaction_hash}-staking-reward`,
        value: new BigNumber(1000000),
        fee: new BigNumber(0),
        senders: [getEnv("HEDERA_STAKING_REWARD_ACCOUNT_ID")],
        recipients: [mockAddress],
      },
      {
        type: "OUT",
        hash: mockTransaction.transaction_hash,
      },
    ]);
  });

  it("should call thirdwebClient when erc20TokenBalances is provided", async () => {
    await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: false,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
      erc20TokenBalances: [
        {
          balance: new BigNumber(100),
          token: mockTokenERC20,
        },
      ],
    });

    expect(thirdwebClient.getERC20TransactionsForAccount).toHaveBeenCalledWith({
      fetchAllPages: false,
      address: mockAddress,
      contractAddresses: [mockTokenERC20.contractAddress],
      order: "desc",
      limit: 10,
      to: null,
    });
  });

  it("should NOT call thirdwebClient when erc20TokenBalances is undefined", async () => {
    await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: { minHeight: 0, limit: 10, order: "desc" },
      mirrorTokens: [],
      fetchAllPages: false,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(thirdwebClient.getERC20TransactionsForAccount).not.toHaveBeenCalled();
  });

  it("should parse composite cursor from lastPagingToken", async () => {
    const compositeCursor = "1625097602.000000000:1625097602";

    await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: {
        minHeight: 0,
        limit: 10,
        order: "desc",
        lastPagingToken: compositeCursor,
      },
      mirrorTokens: [],
      fetchAllPages: false,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
      erc20TokenBalances: [
        {
          balance: new BigNumber(100),
          token: mockTokenERC20,
        },
      ],
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ pagingToken: "1625097602.000000000" }),
    );
    expect(thirdwebClient.getERC20TransactionsForAccount).toHaveBeenCalledWith(
      expect.objectContaining({ to: "1625097602" }),
    );
  });

  it("should create composite cursor in nextCursor when both sources return data", async () => {
    const mockMirrorTx = getMockedMirrorTransaction({
      transfers: [createMirrorCoinTransfer(mockAddress, -500000)],
    });
    const mockThirdwebTx = getMockedThirdwebTransaction({
      address: mockTokenERC20.contractAddress,
      transactionHash: "0xerc20hash",
    });
    const mockERC20Operation = getMockERC20Operation({
      hash: "0xerc20hash",
      from: "0xfromaddress",
      to: "0xtoaddress",
      token: mockTokenERC20,
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockMirrorTx],
      nextCursor: "1625097602.000000000",
    });
    (thirdwebClient.getERC20TransactionsForAccount as jest.Mock).mockResolvedValue([
      mockThirdwebTx,
    ]);
    jest.spyOn(networkUtils, "getERC20Operations").mockResolvedValue([mockERC20Operation]);

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: false,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
      erc20TokenBalances: [
        {
          balance: new BigNumber(100),
          token: mockTokenERC20,
        },
      ],
    });

    const [mirrorCursor, thirdwebCursor] = result.nextCursor?.split(":") ?? [];

    expect(mirrorCursor?.length).toBeGreaterThan(0);
    expect(thirdwebCursor?.length).toBeGreaterThan(0);
  });

  it("should return mirror cursor only when erc20TokenBalances is undefined", async () => {
    const mockTransactions = [
      getMockedMirrorTransaction({
        transfers: [createMirrorCoinTransfer(mockAddress, -500000)],
      }),
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: "1625097602.000000000",
    });

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: false,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.nextCursor).toBe("1625097602.000000000");
    expect(result.nextCursor).not.toContain(":");
  });

  it("should return null cursor when both sources have no more data", async () => {
    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: false,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
      erc20TokenBalances: [
        {
          balance: new BigNumber(100),
          token: mockTokenERC20,
        },
      ],
    });

    expect(result.nextCursor).toBeNull();
  });

  it("should handle case where ERC20 transactions don't fit in limit", async () => {
    const mockMirrorTxs = Array.from({ length: 15 }, (_, i) =>
      getMockedMirrorTransaction({
        consensus_timestamp: `${1625097600 + 14 - i}.000000000`,
        transfers: [createMirrorCoinTransfer(mockAddress, -500000)],
      }),
    );

    const mockThirdwebTxs = Array.from({ length: 5 }, (_, i) =>
      getMockedThirdwebTransaction({
        blockTimestamp: 1625097595 + 4 - i,
      }),
    );

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockMirrorTxs,
      nextCursor: "1625097600.000000000",
    });
    (thirdwebClient.getERC20TransactionsForAccount as jest.Mock).mockResolvedValue(mockThirdwebTxs);
    jest.spyOn(networkUtils, "getERC20Operations").mockResolvedValue([]);

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      pagination: mockPagination,
      mirrorTokens: [],
      fetchAllPages: false,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
      erc20TokenBalances: [
        {
          balance: new BigNumber(100),
          token: mockTokenERC20,
        },
      ],
    });

    expect(result.coinOperations).toHaveLength(10);
    expect(result.tokenOperations).toHaveLength(0);
    expect(result.nextCursor).toBe("1625097605.000000000:");
  });
});
