import BigNumber from "bignumber.js";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { getEnv } from "@ledgerhq/live-env";
import { listOperations } from "./listOperations";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import * as networkUtils from "../network/utils";
import {
  getMockedCurrency,
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedEnrichedERC20Transfer } from "../test/fixtures/common.fixture";
import { getMockedERC20TokenTransfer } from "../test/fixtures/hgraph.fixture";
import {
  getMockedMirrorAccount,
  getMockedMirrorContractCallResult,
  getMockedMirrorToken,
  getMockedMirrorTransaction,
} from "../test/fixtures/mirror.fixture";
import type { HederaMirrorTransaction, StakingAnalysis, SyntheticBlock } from "../types";
import * as utils from "./utils";

setupMockCryptoAssetsStore();

jest.mock("@ledgerhq/coin-framework/account/accountId");
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("../network/api");
jest.mock("../network/hgraph");
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  base64ToUrlSafeBase64: jest.fn().mockImplementation(hash => `encoded-${hash}`),
  toEVMAddress: jest.fn().mockImplementation(async address => `evm-${address}`),
  getMemoFromBase64: jest.fn().mockImplementation(memo => (memo ? `decoded-${memo}` : null)),
  getSyntheticBlock: jest.fn(),
  analyzeStakingOperation: jest.fn(),
}));
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  enrichERC20Transfers: jest.fn(),
}));

describe("listOperations", () => {
  const mockCurrency = getMockedCurrency();
  const mockMirrorAccount = getMockedMirrorAccount({ account: "0.0.12345" });
  const mockSyntheticBlock: SyntheticBlock = {
    blockHeight: 1000000,
    blockHash: "0x100000",
    blockTime: new Date(),
  };
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
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([]);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(0),
    );
    (encodeOperationId as jest.Mock).mockImplementation(
      (accountId, hash, type) => `${accountId}-${hash}-${type}`,
    );
    (encodeTokenAccountId as jest.Mock).mockImplementation(
      (accountId, token) => `${accountId}-${token.id}`,
    );
    (utils.getSyntheticBlock as jest.Mock).mockReturnValue(mockSyntheticBlock);
    (utils.analyzeStakingOperation as jest.Mock).mockResolvedValue(null);
    (networkUtils.enrichERC20Transfers as jest.Mock).mockReturnValue([]);
  });

  it("should return empty arrays when no transactions are found", async () => {
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      fetchAllPages: true,
      pagingToken: null,
      order: mockPagination.order,
      limit: mockPagination.limit,
    });
    expect(hgraphClient.getERC20Transfers).toHaveBeenCalledTimes(1);
    expect(hgraphClient.getERC20Transfers).toHaveBeenCalledWith({
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      fetchAllPages: true,
      order: mockPagination.order,
      limit: mockPagination.limit,
      tokenEvmAddresses: [],
    });
    expect(hgraphClient.getLastestIndexedConsensusTimestamp).toHaveBeenCalledTimes(1);
    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
  });

  it("should parse HBAR transfer transactions correctly", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        memo_base64: "test-memo",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [
          { account: mockMirrorAccount.account, amount: -1000000 },
          { account: "0.0.67890", amount: 1000000 },
        ],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
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
        value: expect.any(Object),
        hash: "hash1",
        fee: expect.any(Object),
        date: expect.any(Date),
        senders: [mockMirrorAccount.account],
        recipients: ["0.0.67890"],
        extra: {
          pagingToken: "1625097600.000000000",
          consensusTimestamp: "1625097600.000000000",
          memo: "decoded-test-memo",
        },
      },
    ]);
  });

  it("should parse HTS token transfer transactions correctly", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [
          {
            token_id: mockTokenHTS.contractAddress,
            account: mockMirrorAccount.account,
            amount: -1000,
          },
          { token_id: mockTokenHTS.contractAddress, account: "0.0.67890", amount: 1000 },
        ],
        staking_reward_transfers: [],
        transfers: [],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

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
        contract: mockTokenHTS.contractAddress,
        standard: "hts",
        senders: [mockMirrorAccount.account],
        recipients: ["0.0.67890"],
        extra: {
          pagingToken: "1625097600.000000000",
          consensusTimestamp: "1625097600.000000000",
        },
      },
    ]);
  });

  it("should parse ERC20 token transfer transactions correctly", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const sharedHash = "erc20-transfer-hash";
    const sharedTimestamp = "1625097600.000000000";
    const memo = "xyz";

    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: sharedTimestamp,
      transaction_hash: sharedHash,
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      memo_base64: memo,
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      transaction_hash: sharedHash,
      consensus_timestamp: Number(sharedTimestamp.split(".")[0]) * 10 ** 9,
      sender_account_id: 12345,
      receiver_account_id: 67890,
      sender_evm_address: mockMirrorAccount.evm_address,
      receiver_evm_address: "0xrecipient",
      payer_account_id: 12345,
      amount: 5000000,
    });
    const mockContractCallResult = getMockedMirrorContractCallResult({
      block_hash: "0xblockhash123",
      gas_consumed: 75000,
      gas_limit: 100000,
      gas_used: 75000,
    });
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [{ token: mockTokenERC20, balance: new BigNumber(10000000) }],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        standard: "erc20",
        contract: mockTokenERC20.contractAddress,
        hash: mockMirrorTransaction.transaction_hash,
        value: new BigNumber(5000000),
        fee: new BigNumber(300000),
        senders: ["0.0.12345"],
        recipients: ["0.0.67890"],
        blockHash: mockContractCallResult.block_hash,
        extra: expect.objectContaining({
          pagingToken: mockMirrorTransaction.consensus_timestamp,
          consensusTimestamp: mockMirrorTransaction.consensus_timestamp,
          memo: `decoded-${mockMirrorTransaction.memo_base64}`,
          gasConsumed: mockContractCallResult.gas_consumed,
          gasLimit: mockContractCallResult.gas_limit,
          gasUsed: mockContractCallResult.gas_used,
        }),
      }),
    ]);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "FEES",
        value: new BigNumber(300000),
        hash: sharedHash,
      }),
    ]);
  });

  it("should use EVM address for sender/recipient when account_id is null in ERC20 transfer", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const sharedHash = "erc20-transfer-hash";
    const sharedTimestamp = "1625097600.000000000";

    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: sharedTimestamp,
      transaction_hash: sharedHash,
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      transaction_hash: sharedHash,
      consensus_timestamp: Number(sharedTimestamp.split(".")[0]) * 10 ** 9,
      sender_account_id: null,
      receiver_account_id: null,
      sender_evm_address: mockMirrorAccount.evm_address,
      receiver_evm_address: "0xrecipient123",
      payer_account_id: 12345,
      amount: 5000000,
    });
    const mockContractCallResult = getMockedMirrorContractCallResult();
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [{ token: mockTokenERC20, balance: new BigNumber(10000000) }],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        senders: [mockMirrorAccount.evm_address],
        recipients: [mockERC20Transfer.receiver_evm_address],
      }),
    ]);
  });

  it("should parse token associate transactions correctly", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
        name: "TOKENASSOCIATE",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([]);
    expect(result.coinOperations).toMatchObject([
      {
        type: "ASSOCIATE_TOKEN",
        value: expect.any(Object),
        hash: "hash1",
        fee: expect.any(Object),
        senders: [mockMirrorAccount.account],
        recipients: [],
        extra: {
          pagingToken: "1625097600.000000000",
          consensusTimestamp: "1625097600.000000000",
        },
      },
    ]);
  });

  it("should include associatedTokenId in extra when ASSOCIATE_TOKEN creates a token", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockMirrorTransaction = {
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
      name: "TOKENASSOCIATE",
    };

    const mockMirrorToken = getMockedMirrorToken({
      token_id: mockTokenHTS.contractAddress,
      created_timestamp: mockMirrorTransaction.consensus_timestamp,
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockMirrorTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [mockMirrorToken],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([]);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "ASSOCIATE_TOKEN",
        hash: "hash1",
        extra: expect.objectContaining({
          associatedTokenId: mockTokenHTS.contractAddress,
        }),
      }),
    ]);
  });

  it("should skip token operations when token is not found in cryptoassets", async () => {
    const tokenId = "0.0.7890";
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [
          { token_id: tokenId, account: mockMirrorAccount.account, amount: -1000 },
          { token_id: tokenId, account: "0.0.67890", amount: 1000 },
        ],
        staking_reward_transfers: [],
        transfers: [],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
  });

  it("should use pagination parameters correctly", async () => {
    const mockPagination: Pagination = {
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
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      fetchAllPages: true,
      pagingToken: "1625097500.000000000",
      order: "asc",
      limit: 20,
    });
  });

  it("should handle failed transactions", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "INVALID_SIGNATURE",
        memo_base64: "",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [
          { account: mockMirrorAccount.account, amount: -1000000 },
          { account: "0.0.67890", amount: 1000000 },
        ],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      currency: mockCurrency,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toMatchObject([{ hasFailed: true }]);
  });

  it("should create REWARD operation when staking rewards are present", async () => {
    const mockTransaction: Partial<HederaMirrorTransaction> = {
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      memo_base64: "",
      token_transfers: [],
      staking_reward_transfers: [{ account: mockMirrorAccount.account, amount: 1000000 }],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
      name: "CRYPTOTRANSFER",
    };

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      currency: mockCurrency,
      mirrorTokens: [],
      erc20Tokens: [],
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
        recipients: [mockMirrorAccount.account],
      },
      {
        type: "OUT",
        hash: mockTransaction.transaction_hash,
      },
    ]);
  });

  it("should create REWARD operation for ERC20 transfers with staking rewards", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const mockRewardAmount = 10000000;

    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "erc20-transfer-hash",
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      staking_reward_transfers: [{ account: mockMirrorAccount.account, amount: mockRewardAmount }],
      token_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
    });

    const mockERC20Transfer = getMockedERC20TokenTransfer({
      transaction_hash: mockMirrorTransaction.transaction_hash,
      consensus_timestamp:
        Number(mockMirrorTransaction.consensus_timestamp.split(".")[0]) * 10 ** 9,
      sender_account_id: 12345,
      receiver_account_id: 67890,
      sender_evm_address: mockMirrorAccount.evm_address,
      receiver_evm_address: "0xrecipient",
      payer_account_id: 12345,
      amount: 5000000,
    });

    const mockContractCallResult = getMockedMirrorContractCallResult();
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(mockMirrorTransaction.consensus_timestamp),
    );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [{ token: mockTokenERC20, balance: new BigNumber(10000000) }],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        standard: "erc20",
        contract: mockTokenERC20.contractAddress,
        hash: mockMirrorTransaction.transaction_hash,
        value: new BigNumber(mockERC20Transfer.amount),
      }),
    ]);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "REWARD",
        hash: `${mockMirrorTransaction.transaction_hash}-staking-reward`,
        value: new BigNumber(mockRewardAmount),
      }),
      expect.objectContaining({
        type: "FEES",
        hash: mockMirrorTransaction.transaction_hash,
        value: new BigNumber(mockMirrorTransaction.charged_tx_fee),
      }),
    ]);
  });

  it("should create STAKE operation when UPDATE_ACCOUNT transaction stakes to a node", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        memo_base64: "",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
        name: "CRYPTOUPDATEACCOUNT",
      },
    ];

    const mockStakingAnalysis: StakingAnalysis = {
      operationType: "STAKE",
      previousStakingNodeId: null,
      targetStakingNodeId: 3,
      stakedAmount: BigInt(1000000000),
    };

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });
    (utils.analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([]);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "STAKE",
        hash: "hash1",
        fee: new BigNumber(500000),
        extra: expect.objectContaining({
          previousStakingNodeId: null,
          targetStakingNodeId: 3,
          stakedAmount: new BigNumber(1000000000),
        }),
      }),
    ]);
  });

  it("should create UNSTAKE operation when UPDATE_ACCOUNT transaction removes staking", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        memo_base64: "",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
        name: "CRYPTOUPDATEACCOUNT",
      },
    ];

    const mockStakingAnalysis: StakingAnalysis = {
      operationType: "UNSTAKE",
      previousStakingNodeId: 3,
      targetStakingNodeId: null,
      stakedAmount: BigInt(0),
    };

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });
    (utils.analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([]);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "UNSTAKE",
        hash: "hash1",
        fee: new BigNumber(500000),
        extra: expect.objectContaining({
          previousStakingNodeId: 3,
          targetStakingNodeId: null,
          stakedAmount: new BigNumber(0),
        }),
      }),
    ]);
  });

  it("should skip FEES operations for HTS IN transfers", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [
          { token_id: mockTokenHTS.contractAddress, account: "0.0.67890", amount: -1000 },
          {
            token_id: mockTokenHTS.contractAddress,
            account: mockMirrorAccount.account,
            amount: 1000,
          },
        ],
        staking_reward_transfers: [],
        transfers: [],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([expect.objectContaining({ type: "IN" })]);
  });

  it("should skip FEES operations for ERC20 IN transfers", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const sharedHash = "erc20-in-transfer-hash";
    const sharedTimestamp = "1625097600.000000000";
    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: sharedTimestamp,
      transaction_hash: sharedHash,
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [],
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      transaction_hash: sharedHash,
      consensus_timestamp: Number(sharedTimestamp.split(".")[0]) * 10 ** 9,
      sender_account_id: 67890,
      receiver_account_id: 12345,
      sender_evm_address: "0xsender",
      receiver_evm_address: mockMirrorAccount.evm_address,
      payer_account_id: 67890,
      amount: 5000000,
    });
    const mockContractCallResult = getMockedMirrorContractCallResult();
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [{ token: mockTokenERC20, balance: new BigNumber(10000000) }],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([expect.objectContaining({ type: "IN" })]);
  });

  it("should skip FEES operations when skipFeesForTokenOperations is true", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        token_transfers: [
          {
            token_id: mockTokenHTS.contractAddress,
            account: mockMirrorAccount.account,
            amount: -1000,
          },
          { token_id: mockTokenHTS.contractAddress, account: "0.0.67890", amount: 1000 },
        ],
        staking_reward_transfers: [],
        transfers: [],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: true,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toHaveLength(0);
    expect(result.tokenOperations).toHaveLength(1);
    expect(result.tokenOperations[0].type).toBe("OUT");
  });

  it("should use encoded hash when useEncodedHash is true", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        memo_base64: "",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [
          { account: mockMirrorAccount.account, amount: -1000000 },
          { account: "0.0.67890", amount: 1000000 },
        ],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: true,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toHaveLength(1);
    expect(result.coinOperations[0].hash).toBe("encoded-hash1");
  });

  it("should use synthetic blocks when useSyntheticBlocks is true", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "SUCCESS",
        memo_base64: "",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [
          { account: mockMirrorAccount.account, amount: -1000000 },
          { account: "0.0.67890", amount: 1000000 },
        ],
        name: "CRYPTOTRANSFER",
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: true,
    });

    expect(utils.getSyntheticBlock).toHaveBeenCalledTimes(1);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        blockHeight: mockSyntheticBlock.blockHeight,
        blockHash: mockSyntheticBlock.blockHash,
      }),
    ]);
  });

  it("should deduplicate CONTRACT_CALL operations when ERC20 transfer exists for same hash", async () => {
    const sharedHash = "contract-call-hash";
    const sharedTimestamp = "1625097600.000000000";
    const mockTokenERC20 = getMockedERC20TokenCurrency();

    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: sharedTimestamp,
      transaction_hash: sharedHash,
      charged_tx_fee: 200000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -200000 }],
      token_transfers: [],
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      transaction_hash: sharedHash,
      consensus_timestamp: Number(sharedTimestamp) * 10 ** 9,
      sender_account_id: 1234,
      sender_evm_address: mockMirrorAccount.evm_address,
      payer_account_id: 1234,
      amount: 1000000,
    });
    const mockContractCallResult = getMockedMirrorContractCallResult();
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockMirrorTransaction],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(mockContractCallResult);
    (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(mockMirrorTransaction);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [{ token: mockTokenERC20, balance: new BigNumber(5000000) }],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([expect.objectContaining({ type: "FEES" })]);
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({ type: "OUT", standard: "erc20" }),
    ]);
  });

  it("should sort with nanosecond precision", async () => {
    const mockTransactions: Partial<HederaMirrorTransaction>[] = [
      {
        consensus_timestamp: "1625097600.000000003",
        transaction_hash: "hash3",
        charged_tx_fee: 100000,
        result: "SUCCESS",
        name: "CRYPTOTRANSFER",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
      },
      {
        consensus_timestamp: "1625097600.000000001",
        transaction_hash: "hash1",
        charged_tx_fee: 100000,
        result: "SUCCESS",
        name: "CRYPTOTRANSFER",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [{ account: mockMirrorAccount.account, amount: -100000 }],
      },
      {
        consensus_timestamp: "1625097600.000000002",
        transaction_hash: "hash2",
        charged_tx_fee: 100000,
        result: "SUCCESS",
        name: "CRYPTOTRANSFER",
        token_transfers: [],
        staking_reward_transfers: [],
        transfers: [{ account: mockMirrorAccount.account, amount: -200000 }],
      },
    ];

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: mockTransactions,
      nextCursor: null,
    });

    const result = await listOperations({
      pagination: { minHeight: 0, limit: 10, order: "desc" },
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations.map(op => op.hash)).toEqual(["hash3", "hash2", "hash1"]);
  });

  it("should merge and sort operations from both mirror and hgraph sources", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000003",
      transaction_hash: "mirror-hash",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -1000000 },
        { account: "0.0.67890", amount: 1000000 },
      ],
    });
    const mockERC20MirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000001",
      transaction_hash: "erc20-hash",
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      transaction_hash: mockERC20MirrorTransaction.transaction_hash,
      consensus_timestamp:
        Number(mockERC20MirrorTransaction.consensus_timestamp.split(".")[0]) * 10 ** 9 + 1,
      sender_account_id: 12345,
      receiver_account_id: 67890,
      sender_evm_address: mockMirrorAccount.evm_address,
      receiver_evm_address: "0xrecipient",
      payer_account_id: 12345,
      amount: 5000000,
    });

    const mockContractCallResult = getMockedMirrorContractCallResult();
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockERC20MirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockMirrorTransaction],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber("1625097600.000000003"),
    );

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
    });

    const result = await listOperations({
      pagination: mockPagination,
      currency: mockCurrency,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      erc20Tokens: [{ token: mockTokenERC20, balance: new BigNumber(10000000) }],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toHaveLength(1);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({ hash: mockMirrorTransaction.transaction_hash, type: "OUT" }),
      expect.objectContaining({ hash: mockERC20MirrorTransaction.transaction_hash, type: "FEES" }),
    ]);
  });
});
