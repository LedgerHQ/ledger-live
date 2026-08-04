import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { TokenCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import * as networkUtils from "../network/utils";
import { getMockedEnrichedERC20Transfer } from "../test/fixtures/common.fixture";
import {
  getMockedCurrency,
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedERC20TokenTransfer } from "../test/fixtures/hgraph.fixture";
import {
  getMockedMirrorAccount,
  getMockedMirrorContractCallResult,
  getMockedMirrorToken,
  getMockedMirrorTransaction,
} from "../test/fixtures/mirror.fixture";
import type { StakingAnalysis, SyntheticBlock } from "../types";
import { listOperationsV2 as listOperations } from "./listOperations.v2";
import * as utils from "./utils";

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

jest.mock("@ledgerhq/ledger-wallet-framework/account/accountId", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/accountId"),
  encodeTokenAccountId: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../network/api");
jest.mock("../network/hgraph");
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  enrichERC20Transfers: jest.fn(),
  analyzeStakingOperation: jest.fn(),
}));
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  base64ToUrlSafeBase64: jest.fn().mockImplementation(hash => `encoded-${hash}`),
  getMemoFromBase64: jest.fn().mockImplementation(memo => (memo ? `decoded-${memo}` : null)),
  getSyntheticBlock: jest.fn(),
  extractFeesPayer: jest.fn(),
}));

describe("listOperationsV2", () => {
  const mockCurrency = getMockedCurrency();
  const mockMirrorAccount = getMockedMirrorAccount();
  const mockSyntheticBlock: SyntheticBlock = {
    blockHeight: 1000000,
    blockHash: "0x100000",
    blockTime: new Date(),
  };
  const mockLimit = 10;
  const mockOrder = "desc";

  beforeEach(() => {
    jest.clearAllMocks();

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(0),
    );
    (encodeOperationId as jest.Mock).mockImplementation(
      (accountId, hash, type) => `${accountId}-${hash}-${type}`,
    );
    (encodeTokenAccountId as jest.Mock).mockImplementation(
      (accountId, token) => `${accountId}-${token.id}`,
    );
    (utils.getSyntheticBlock as jest.Mock).mockReturnValue(mockSyntheticBlock);
    (utils.extractFeesPayer as jest.Mock).mockImplementation(input =>
      typeof input === "string"
        ? input.split("-")[0]
        : (input.transaction_id?.split("-")[0] ?? "0.0.0"),
    );
    (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(null);
    (networkUtils.enrichERC20Transfers as jest.Mock).mockReturnValue([]);
  });

  it("should return empty arrays when no transactions are found", async () => {
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      configOrCurrencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      fetchAllPages: true,
      pagingToken: null,
      order: mockOrder,
      limit: mockLimit,
    });
    expect(hgraphClient.getERC20Transfers).toHaveBeenCalledTimes(1);
    expect(hgraphClient.getERC20Transfers).toHaveBeenCalledWith({
      configOrCurrencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      fetchAllPages: true,
      order: mockOrder,
      limit: mockLimit,
      tokenEvmAddresses: [],
    });
    expect(hgraphClient.getLatestIndexedConsensusTimestamp).toHaveBeenCalledTimes(1);
    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
  });

  it("should parse HBAR transfer transactions correctly", async () => {
    const mockTransaction = getMockedMirrorTransaction({
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
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([]);
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
    const mockTransaction = getMockedMirrorTransaction({
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
      transfers: [
        { account: mockMirrorAccount.account, amount: -500000 },
        { account: "0.0.3", amount: 500000 },
      ],
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
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
      transaction_id: `${mockMirrorAccount.account}-${sharedTimestamp}`,
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      token_evm_address: mockTokenERC20.contractAddress,
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
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
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
        blockHash: null,
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
        // a fee goes from the payer to the node, not between the token transfer's parties
        senders: [mockMirrorAccount.account],
        recipients: [mockMirrorTransaction.node],
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
      token_evm_address: mockTokenERC20.contractAddress,
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
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
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

  it("should skip ERC20 operations when sender evm address is null", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const sharedHash = "erc20-null-sender-hash";
    const sharedTimestamp = "1625097600.000000000";
    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: sharedTimestamp,
      transaction_hash: sharedHash,
      name: "CONTRACTCALL",
      transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      token_evm_address: mockTokenERC20.contractAddress,
      transaction_hash: sharedHash,
      consensus_timestamp: Number(sharedTimestamp.split(".")[0]) * 10 ** 9,
      sender_account_id: null,
      receiver_account_id: 67890,
      sender_evm_address: null,
      receiver_evm_address: "0xrecipient",
      payer_account_id: 12345,
      amount: 5000000,
    });
    const mockContractCallResult = getMockedMirrorContractCallResult();
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([]);
    expect(result.coinOperations).toEqual([]);
  });

  it("should parse token associate transactions correctly", async () => {
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
      name: "TOKENASSOCIATE",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
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
        recipients: ["0.0.3"],
        extra: {
          pagingToken: "1625097600.000000000",
          consensusTimestamp: "1625097600.000000000",
        },
      },
    ]);
  });

  it("should include associatedTokenId in extra when ASSOCIATE_TOKEN creates a token", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
      name: "TOKENASSOCIATE",
    });

    const mockMirrorToken = getMockedMirrorToken({
      token_id: mockTokenHTS.contractAddress,
      created_timestamp: mockMirrorTransaction.consensus_timestamp,
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockMirrorTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [mockMirrorToken],
      tokenEvmAddresses: [],
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

  it("should return raw token operations even when token is not in CAL", async () => {
    const tokenId = "0.0.7890";
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      token_transfers: [
        { token_id: tokenId, account: mockMirrorAccount.account, amount: -1000 },
        { token_id: tokenId, account: "0.0.67890", amount: 1000 },
      ],
      staking_reward_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -500000 },
        { account: "0.0.3", amount: 500000 },
      ],
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        contract: tokenId,
        standard: "hts",
        type: "OUT",
      }),
    ]);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "FEES",
      }),
    ]);
  });

  // child records such as TOKENWIPE land here; their `nonce` is never consulted
  it("should not emit a coin op for a token transfer with no HBAR transfers and no fee", async () => {
    const tokenId = "0.0.7890";
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 0,
      token_transfers: [
        { token_id: tokenId, account: mockMirrorAccount.account, amount: -1000 },
        { token_id: tokenId, account: "0.0.67890", amount: 1000 },
      ],
      transfers: [],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({ contract: tokenId, standard: "hts", type: "OUT" }),
    ]);
  });

  it("should use pagination parameters correctly", async () => {
    const customOrder = "asc";
    const customLimit = 20;
    const lastPagingToken = "1625097500.000000000";

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

    await listOperations({
      limit: customLimit,
      order: customOrder,
      cursor: lastPagingToken,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(apiClient.getAccountTransactions).toHaveBeenCalledTimes(1);
    expect(apiClient.getAccountTransactions).toHaveBeenCalledWith({
      configOrCurrencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      fetchAllPages: true,
      pagingToken: lastPagingToken,
      order: customOrder,
      limit: customLimit,
    });
  });

  it("should handle failed transactions", async () => {
    const mockTransaction = getMockedMirrorTransaction({
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
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      currencyId: mockCurrency.id,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toMatchObject([{ hasFailed: true }]);
  });

  it("should include inferred fees payer in operation extra", async () => {
    (utils.extractFeesPayer as jest.Mock).mockReturnValue("0.0.23");

    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      transaction_id: "0.0.10067173-1761755118-730000493",
      charged_tx_fee: 40743,
      result: "INSUFFICIENT_PAYER_BALANCE",
      token_transfers: [],
      staking_reward_transfers: [],
      // account must be a transfer participant so the op survives the NONE filter; fee payer stays a different account
      transfers: [
        { account: "0.0.23", amount: -40743 },
        { account: mockMirrorAccount.account, amount: 40743 },
      ],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      currencyId: mockCurrency.id,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toMatchObject([
      {
        extra: {
          transactionId: "0.0.10067173-1761755118-730000493",
          feesPayer: "0.0.23",
        },
      },
    ]);
  });

  it("should create REWARD operation when staking rewards are present", async () => {
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      memo_base64: "",
      token_transfers: [],
      staking_reward_transfers: [{ account: mockMirrorAccount.account, amount: 1000000 }],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      currencyId: mockCurrency.id,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    const rewardTimestamp = result.coinOperations[0].date.getTime();
    const mainTimestamp = result.coinOperations[1].date.getTime();

    expect(result.tokenOperations).toEqual([]);
    expect(rewardTimestamp).toBe(mainTimestamp + 1);
    expect(result.coinOperations[0].extra).not.toHaveProperty("chargedTxFee");
    expect(result.coinOperations).toMatchObject([
      {
        type: "REWARD",
        hash: utils.createStakingRewardOperationHash(mockTransaction.transaction_hash ?? ""),
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

  it("should sum several staking reward rows for the same account", async () => {
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      memo_base64: "",
      token_transfers: [],
      // the mirror node can report an account's reward across several rows
      staking_reward_transfers: [
        { account: mockMirrorAccount.account, amount: 600000 },
        { account: mockMirrorAccount.account, amount: 400000 },
      ],
      transfers: [{ account: mockMirrorAccount.account, amount: 500000 }],
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      currencyId: mockCurrency.id,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toMatchObject([
      { type: "REWARD", value: new BigNumber(1000000) },
      // the reward is netted out of the transfer row, leaving only the fee this account paid
      { type: "FEES", value: new BigNumber(500000) },
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
      token_evm_address: mockTokenERC20.contractAddress,
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
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(mockMirrorTransaction.consensus_timestamp),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
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
        hash: utils.createStakingRewardOperationHash(mockMirrorTransaction.transaction_hash ?? ""),
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
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      memo_base64: "",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      name: "CRYPTOUPDATEACCOUNT",
    });

    const mockStakingAnalysis: StakingAnalysis = {
      operationType: "STAKE",
      previousStakingNodeId: null,
      targetStakingNodeId: 3,
      stakedAmount: BigInt(1000000000),
    };

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
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
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      memo_base64: "",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      name: "CRYPTOUPDATEACCOUNT",
    });

    const mockStakingAnalysis: StakingAnalysis = {
      operationType: "UNSTAKE",
      previousStakingNodeId: 3,
      targetStakingNodeId: null,
      stakedAmount: BigInt(0),
    };

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
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
    const mockTransaction = getMockedMirrorTransaction({
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
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([expect.objectContaining({ type: "IN" })]);
  });

  it("should drop NONE operations for HTS transfers between third parties (account not a participant)", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      token_transfers: [
        { token_id: mockTokenHTS.contractAddress, account: "0.0.67890", amount: -1000 },
        { token_id: mockTokenHTS.contractAddress, account: "0.0.99999", amount: 1000 },
      ],
      staking_reward_transfers: [],
      transfers: [],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
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
      token_evm_address: mockTokenERC20.contractAddress,
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
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([expect.objectContaining({ type: "IN" })]);
  });

  it("should produce two token operations for a swap with two different-token transfers", async () => {
    const sharedHash = "erc20-in-transfer-hash";
    const mockTokenA = getMockedERC20TokenCurrency({
      id: TokenCurrencyIdSchema.parse("hedera/erc20/0xTokenA"),
      contractAddress: "0xTokenA",
    });
    const mockTokenB = getMockedERC20TokenCurrency({
      id: TokenCurrencyIdSchema.parse("hedera/erc20/0xTokenB"),
      contractAddress: "0xTokenB",
    });

    const mockErc20TransferOut = getMockedERC20TokenTransfer({
      token_evm_address: mockTokenA.contractAddress,
      sender_evm_address: mockMirrorAccount.evm_address,
      sender_account_id: 12345,
      receiver_account_id: 99999,
      transfer_type: "transfer",
      amount: 1000,
      transaction_hash: sharedHash,
    });
    const mockErc20TransferIn = getMockedERC20TokenTransfer({
      token_evm_address: mockTokenB.contractAddress,
      receiver_evm_address: mockMirrorAccount.evm_address,
      sender_account_id: 99999,
      receiver_account_id: 12345,
      transfer_type: "transfer",
      amount: 2000,
      transaction_hash: sharedHash,
    });

    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      transfers: [mockErc20TransferOut, mockErc20TransferIn],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber("1625097600.000000000"),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest
        .fn()
        .mockResolvedValueOnce(mockTokenA) // for transfer out
        .mockResolvedValueOnce(mockTokenB), // for transfer in
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenA.contractAddress, mockTokenB.contractAddress],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([expect.objectContaining({ type: "FEES" })]);
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({ type: "OUT" }),
      expect.objectContaining({ type: "IN" }),
    ]);
  });

  it("should skip FEES operations when skipFeesForTokenOperations is true", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockTransaction = getMockedMirrorTransaction({
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
      // the account pays the fee in HBAR, so a FEES coin op is built and has to be dropped
      transfers: [
        { account: mockMirrorAccount.account, amount: -500000 },
        { account: "0.0.3", amount: 500000 },
      ],
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: true,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toHaveLength(1);
    expect(result.tokenOperations[0].type).toBe("OUT");
  });

  it("should keep a FEES operation whose hash has no token operation when skipping token fees", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const tokenTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash-token",
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
      transfers: [
        { account: mockMirrorAccount.account, amount: -500000 },
        { account: "0.0.3", amount: 500000 },
      ],
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      name: "CRYPTOTRANSFER",
    });
    // no token transfer, so its fee is the only trace this transaction left on the account
    const feeOnlyTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097601.000000000",
      transaction_hash: "hash-fee-only",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -500000 },
        { account: "0.0.3", amount: 500000 },
      ],
      transaction_id: `${mockMirrorAccount.account}-1625097601.000000000`,
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [tokenTransaction, feeOnlyTransaction],
      nextCursor: null,
    });

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: true,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toMatchObject([{ hash: "hash-fee-only", type: "FEES" }]);
    expect(result.tokenOperations).toMatchObject([{ hash: "hash-token", type: "OUT" }]);
  });

  it("should use encoded hash when useEncodedHash is true", async () => {
    const mockTransaction = getMockedMirrorTransaction({
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
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: true,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([expect.objectContaining({ hash: "encoded-hash1" })]);
  });

  it("should use synthetic blocks when useSyntheticBlocks is true", async () => {
    const mockTransaction = getMockedMirrorTransaction({
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
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
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

  it("should use synthetic block hash for ERC20 transfers when useSyntheticBlocks is true", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const sharedHash = "erc20-transfer-hash-synthetic";
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
      token_evm_address: mockTokenERC20.contractAddress,
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
      block_hash: "0xevm-block-hash-should-not-be-used",
    });
    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: true,
    });

    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        standard: "erc20",
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
      token_evm_address: mockTokenERC20.contractAddress,
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
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockMirrorTransaction],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(mockContractCallResult);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(sharedTimestamp),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
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
    const mockTransaction1 = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000003",
      transaction_hash: "hash3",
      charged_tx_fee: 100000,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
    });
    const mockTransaction2 = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000001",
      transaction_hash: "hash1",
      charged_tx_fee: 100000,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -100000 }],
    });
    const mockTransaction3 = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000002",
      transaction_hash: "hash2",
      charged_tx_fee: 100000,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -200000 }],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction1, mockTransaction2, mockTransaction3],
      nextCursor: null,
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
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
      transfers: [mockERC20Transfer],
    });

    jest.spyOn(networkUtils, "enrichERC20Transfers").mockResolvedValue([mockEnrichedERC20Transfer]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockMirrorTransaction],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([mockERC20Transfer]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber("1625097600.000000003"),
    );

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [mockTokenERC20.contractAddress],
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

  it("should use rawTx.node as recipient when recipients array is empty", async () => {
    const nodeAccountId = "0.0.5";
    const mockTransaction = getMockedMirrorTransaction({
      node: nodeAccountId,
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -500000 }],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(null);

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([
      expect.objectContaining({ recipients: [nodeAccountId] }),
    ]);
  });

  it("should return no coin operations for a mirror tx with empty transfers", async () => {
    const mockTransaction = getMockedMirrorTransaction({
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(null);

    const result = await listOperations({
      limit: mockLimit,
      order: mockOrder,
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    });

    expect(result.coinOperations).toEqual([]);
  });

  describe("multi-recipient transactions", () => {
    const firstRecipient = "0.0.67890";
    const secondRecipient = "0.0.99999";

    const listArgs = {
      limit: mockLimit,
      order: mockOrder as "desc",
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    };

    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 500000,
      result: "SUCCESS",
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      token_transfers: [],
      staking_reward_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -2500000 },
        { account: firstRecipient, amount: 1000000 },
        { account: secondRecipient, amount: 1000000 },
        { account: "0.0.3", amount: 500000 },
      ],
      name: "CRYPTOTRANSFER",
    });

    beforeEach(() => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [mockTransaction],
        nextCursor: null,
      });
    });

    it("emits one OUT per recipient, each addressed to that recipient alone", async () => {
      const result = await listOperations(listArgs);

      expect(
        result.coinOperations
          .map(op => ({ type: op.type, recipients: op.recipients }))
          .sort((a, b) => a.recipients[0].localeCompare(b.recipients[0])),
      ).toEqual([
        { type: "FEES", recipients: ["0.0.3"] },
        { type: "OUT", recipients: [firstRecipient] },
        { type: "OUT", recipients: [secondRecipient] },
      ]);
    });

    it("splits the outflow so the operation values sum to what left the account", async () => {
      const result = await listOperations(listArgs);

      const total = result.coinOperations.reduce((sum, op) => sum.plus(op.value), new BigNumber(0));

      expect(total).toEqual(new BigNumber(2500000));
    });

    it("keeps the fee out of the per-recipient operations and reports it as its own FEES op", async () => {
      const result = await listOperations(listArgs);

      const feesCharged = result.coinOperations.filter(op => op.fee.gt(0));

      expect(feesCharged).toHaveLength(1);
      expect(feesCharged[0]).toMatchObject({
        type: "FEES",
        value: new BigNumber(500000),
        fee: new BigNumber(500000),
        recipients: ["0.0.3"],
      });
      expect(result.coinOperations.filter(op => op.type === "OUT").map(op => op.value)).toEqual([
        new BigNumber(1000000),
        new BigNumber(1000000),
      ]);
    });

    it("keeps the fee inside the OUT value and emits no FEES op when there is a single recipient", async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            ...mockTransaction,
            transfers: [
              { account: mockMirrorAccount.account, amount: -1500000 },
              { account: firstRecipient, amount: 1000000 },
              { account: "0.0.3", amount: 500000 },
            ],
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(result.coinOperations).toMatchObject([
        {
          id: "hash1:OUT",
          type: "OUT",
          value: new BigNumber(1500000),
          fee: new BigNumber(500000),
          recipients: [firstRecipient],
        },
      ]);
    });

    it("assigns a distinct id to every operation of a multi-recipient transaction", async () => {
      const result = await listOperations(listArgs);

      const ids = result.coinOperations.map(op => op.id);

      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.sort()).toEqual([
        "hash1:FEES",
        `hash1:OUT:${firstRecipient}`,
        `hash1:OUT:${secondRecipient}`,
      ]);
    });

    describe("mainnet 0.0.8835924-1760510873-321619819", () => {
      const payer = "0.0.8835924";
      const usdc = "0.0.456858";
      const sauce = "0.0.5022567";
      const chargedFee = 1176695;

      const listArgsForPayer = { ...listArgs, address: payer };

      beforeEach(() => {
        (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
          transactions: [
            getMockedMirrorTransaction({
              consensus_timestamp: "1760510879.300860000",
              transaction_hash: "hash1",
              transaction_id: `${payer}-1760510873-321619819`,
              charged_tx_fee: chargedFee,
              node: "0.0.15",
              staking_reward_transfers: [],
              transfers: [
                { account: "0.0.15", amount: 55631 },
                { account: "0.0.801", amount: 1121064 },
                { account: payer, amount: -3176695 },
                { account: firstRecipient, amount: 1000000 },
                { account: secondRecipient, amount: 1000000 },
              ],
              token_transfers: [
                { token_id: usdc, account: payer, amount: -10000 },
                { token_id: usdc, account: firstRecipient, amount: 10000 },
                { token_id: sauce, account: payer, amount: -2 },
                { token_id: sauce, account: firstRecipient, amount: 1 },
                { token_id: sauce, account: secondRecipient, amount: 1 },
              ],
              name: "CRYPTOTRANSFER",
            }),
          ],
          nextCursor: null,
        });
      });

      it("emits a FEES operation for the fee and one fee-free OUT per HBAR recipient", async () => {
        const result = await listOperations(listArgsForPayer);

        expect(
          result.coinOperations.map(op => ({
            type: op.type,
            value: op.value,
            fee: op.fee,
            senders: op.senders,
            recipients: op.recipients,
          })),
        ).toEqual([
          {
            type: "FEES",
            value: new BigNumber(chargedFee),
            fee: new BigNumber(chargedFee),
            senders: [payer],
            recipients: ["0.0.15"],
          },
          {
            type: "OUT",
            value: new BigNumber(1000000),
            fee: new BigNumber(0),
            senders: [payer],
            recipients: [secondRecipient],
          },
          {
            type: "OUT",
            value: new BigNumber(1000000),
            fee: new BigNumber(0),
            senders: [payer],
            recipients: [firstRecipient],
          },
        ]);
      });

      it("emits one token operation per recipient of each token", async () => {
        const result = await listOperations(listArgsForPayer);

        expect(
          result.tokenOperations.map(op => ({
            contract: op.contract,
            value: op.value,
            recipients: op.recipients,
          })),
        ).toEqual([
          { contract: usdc, value: new BigNumber(10000), recipients: [firstRecipient] },
          { contract: sauce, value: new BigNumber(1), recipients: [secondRecipient] },
          { contract: sauce, value: new BigNumber(1), recipients: [firstRecipient] },
        ]);
      });

      it("adds the coin operation values back up to the total debited from the account", async () => {
        const result = await listOperations(listArgsForPayer);

        const debited = result.coinOperations.reduce(
          (total, op) => total.plus(op.value),
          new BigNumber(0),
        );

        expect(debited).toEqual(new BigNumber(3176695));
      });

      it("reports the charged transaction fee on every operation even where Operation.fee is 0", async () => {
        const result = await listOperations(listArgsForPayer);
        const operations = [...result.coinOperations, ...result.tokenOperations];

        expect(operations.map(op => op.extra.chargedTxFee)).toEqual(
          operations.map(() => String(chargedFee)),
        );
      });
    });

    it("emits both the HBAR and the HTS movement of a multi-asset transaction", async () => {
      const mockTokenHTS = getMockedHTSTokenCurrency();
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            staking_reward_transfers: [],
            transfers: [
              { account: mockMirrorAccount.account, amount: -1500000 },
              { account: firstRecipient, amount: 1000000 },
              { account: "0.0.3", amount: 500000 },
            ],
            token_transfers: [
              {
                token_id: mockTokenHTS.contractAddress,
                account: mockMirrorAccount.account,
                amount: -1000,
              },
              { token_id: mockTokenHTS.contractAddress, account: firstRecipient, amount: 1000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(result.coinOperations).toMatchObject([
        {
          type: "OUT",
          value: new BigNumber(1500000),
          fee: new BigNumber(500000),
          recipients: [firstRecipient],
        },
      ]);
      expect(result.tokenOperations.map(op => op.id)).toEqual([
        `hash1:OUT:${mockTokenHTS.contractAddress}`,
      ]);
    });

    it("emits one token operation per token id of a multi-asset transfer", async () => {
      const soldToken = "0.0.1001";
      const boughtToken = "0.0.1002";
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            staking_reward_transfers: [],
            transfers: [
              { account: mockMirrorAccount.account, amount: -500000 },
              { account: "0.0.3", amount: 500000 },
            ],
            token_transfers: [
              { token_id: soldToken, account: mockMirrorAccount.account, amount: -1000 },
              { token_id: soldToken, account: firstRecipient, amount: 1000 },
              { token_id: boughtToken, account: firstRecipient, amount: -500 },
              { token_id: boughtToken, account: mockMirrorAccount.account, amount: 500 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(
        result.tokenOperations.map(op => ({
          id: op.id,
          contract: op.contract,
          type: op.type,
          value: op.value,
        })),
      ).toEqual([
        {
          id: `hash1:OUT:${soldToken}`,
          contract: soldToken,
          type: "OUT",
          value: new BigNumber(1000),
        },
        {
          id: `hash1:IN:${boughtToken}`,
          contract: boughtToken,
          type: "IN",
          value: new BigNumber(500),
        },
      ]);
    });

    it("emits no token operation for a token id the account's rows net out to zero", async () => {
      const movedToken = "0.0.1001";
      const passThroughToken = "0.0.1002";
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            staking_reward_transfers: [],
            transfers: [
              { account: mockMirrorAccount.account, amount: -500000 },
              { account: "0.0.3", amount: 500000 },
            ],
            token_transfers: [
              { token_id: movedToken, account: mockMirrorAccount.account, amount: -1000 },
              { token_id: movedToken, account: firstRecipient, amount: 1000 },
              // the account forwards everything it receives, so its holding does not change
              { token_id: passThroughToken, account: firstRecipient, amount: -500 },
              { token_id: passThroughToken, account: mockMirrorAccount.account, amount: 500 },
              { token_id: passThroughToken, account: mockMirrorAccount.account, amount: -500 },
              { token_id: passThroughToken, account: secondRecipient, amount: 500 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(
        result.tokenOperations.map(op => ({ contract: op.contract, value: op.value })),
      ).toEqual([{ contract: movedToken, value: new BigNumber(1000) }]);
    });

    it("emits one token operation per recipient of a multi-recipient token transfer", async () => {
      const tokenId = "0.0.1001";
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            staking_reward_transfers: [],
            transfers: [
              { account: mockMirrorAccount.account, amount: -500000 },
              { account: "0.0.3", amount: 500000 },
            ],
            token_transfers: [
              { token_id: tokenId, account: mockMirrorAccount.account, amount: -1000 },
              { token_id: tokenId, account: firstRecipient, amount: 600 },
              { token_id: tokenId, account: secondRecipient, amount: 400 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(
        result.tokenOperations
          .map(op => ({ id: op.id, value: op.value, recipients: op.recipients }))
          .sort((a, b) => a.recipients[0].localeCompare(b.recipients[0])),
      ).toEqual([
        {
          id: `hash1:OUT:${tokenId}:${firstRecipient}`,
          value: new BigNumber(600),
          recipients: [firstRecipient],
        },
        {
          id: `hash1:OUT:${tokenId}:${secondRecipient}`,
          value: new BigNumber(400),
          recipients: [secondRecipient],
        },
      ]);
    });

    it("splits the outflow when the fee is shared between the node and the reward accounts", async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            // how mainnet actually splits a fee: node, fee collector, and both reward accounts
            transfers: [
              { account: mockMirrorAccount.account, amount: -2500000 },
              { account: firstRecipient, amount: 1000000 },
              { account: secondRecipient, amount: 1000000 },
              { account: "0.0.3", amount: 250000 },
              { account: "0.0.98", amount: 150000 },
              { account: "0.0.800", amount: 50000 },
              { account: "0.0.801", amount: 50000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(
        result.coinOperations
          .map(op => ({ recipients: op.recipients, value: op.value, fee: op.fee }))
          .sort((a, b) => a.recipients[0].localeCompare(b.recipients[0])),
      ).toEqual([
        { recipients: ["0.0.3"], value: new BigNumber(500000), fee: new BigNumber(500000) },
        { recipients: [firstRecipient], value: new BigNumber(1000000), fee: new BigNumber(0) },
        { recipients: [secondRecipient], value: new BigNumber(1000000), fee: new BigNumber(0) },
      ]);
    });

    it("keeps one netted OUT when a second account also sent HBAR", async () => {
      const coSender = "0.0.55555";
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${coSender}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            // the recipient amounts do add up to this account's outflow, but a second account also
            // sent HBAR, so nothing proves it funded those recipients rather than the co-sender
            transfers: [
              { account: mockMirrorAccount.account, amount: -1000000 },
              { account: coSender, amount: -500000 },
              { account: firstRecipient, amount: 600000 },
              { account: secondRecipient, amount: 400000 },
              { account: "0.0.3", amount: 500000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(result.coinOperations).toMatchObject([
        {
          id: "hash1:OUT",
          type: "OUT",
          value: new BigNumber(1000000),
          fee: new BigNumber(0),
          recipients: [secondRecipient, firstRecipient],
        },
      ]);
    });

    it("keeps one netted OUT when the recipient amounts do not add up to what left the account", async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            // the fee rows account for 400000 of the 500000 charged, so the split cannot be trusted
            transfers: [
              { account: mockMirrorAccount.account, amount: -2400000 },
              { account: firstRecipient, amount: 1000000 },
              { account: secondRecipient, amount: 1000000 },
              { account: "0.0.3", amount: 400000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      // the netted value still matches the mirror's own row, so the balance stays correct
      expect(result.coinOperations).toMatchObject([
        {
          id: "hash1:OUT",
          type: "OUT",
          value: new BigNumber(2400000),
          fee: new BigNumber(500000),
        },
      ]);
    });
  });

  describe("transactions whose fee another account paid", () => {
    const otherPayer = "0.0.55555";
    const recipient = "0.0.67890";

    const listArgs = {
      limit: mockLimit,
      order: mockOrder as "desc",
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    };

    it("charges no fee to an OUT the account did not pay for", async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${otherPayer}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            transfers: [
              { account: otherPayer, amount: -500000 },
              { account: mockMirrorAccount.account, amount: -1000000 },
              { account: recipient, amount: 1000000 },
              { account: "0.0.3", amount: 500000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      expect(result.coinOperations).toMatchObject([
        { type: "OUT", value: new BigNumber(1000000), fee: new BigNumber(0) },
      ]);
    });

    it("emits an IN and a FEES op when the account both received and paid", async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            // received 1000000 and paid the 500000 fee, so the mirror nets the row to +500000
            transfers: [
              { account: otherPayer, amount: -1000000 },
              { account: mockMirrorAccount.account, amount: 500000 },
              { account: "0.0.3", amount: 500000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      // the IN reports the gross amount received; the fee it paid is a row of its own
      expect(result.coinOperations).toMatchObject([
        {
          type: "IN",
          value: new BigNumber(1000000),
          fee: new BigNumber(500000),
          senders: [otherPayer],
          recipients: [mockMirrorAccount.account],
        },
        {
          type: "FEES",
          value: new BigNumber(500000),
          fee: new BigNumber(500000),
          // a fee goes from the payer to the node, not between the transfer's parties
          senders: [mockMirrorAccount.account],
          recipients: ["0.0.3"],
        },
      ]);
    });

    it("emits a single IN with no companion FEES op when another account paid", async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${otherPayer}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            transfers: [
              { account: otherPayer, amount: -1500000 },
              { account: mockMirrorAccount.account, amount: 1000000 },
              { account: "0.0.3", amount: 500000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      // an IN op reports the charged fee whoever paid it, but only a payer gets a FEES op
      expect(result.coinOperations).toMatchObject([
        { type: "IN", value: new BigNumber(1000000), fee: new BigNumber(500000) },
      ]);
    });

    it("emits nothing when the account's HBAR nets out and it paid no fee", async () => {
      const sender = "0.0.44444";
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${otherPayer}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            // the account forwards what it receives, so its HBAR balance is unchanged
            transfers: [
              { account: otherPayer, amount: -500000 },
              { account: sender, amount: -1000000 },
              { account: mockMirrorAccount.account, amount: 1000000 },
              { account: mockMirrorAccount.account, amount: -1000000 },
              { account: recipient, amount: 1000000 },
              { account: "0.0.3", amount: 500000 },
            ],
            name: "CRYPTOTRANSFER",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      // a FEES op here would debit a fee the account never paid
      expect(result.coinOperations).toEqual([]);
    });

    it("charges no fee to a STAKE the account did not pay for", async () => {
      const mockStakingAnalysis: StakingAnalysis = {
        operationType: "STAKE",
        previousStakingNodeId: null,
        targetStakingNodeId: 3,
        stakedAmount: BigInt(1000000000),
      };
      (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${otherPayer}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            // staking changes no balance, so only the payer and the node appear
            transfers: [
              { account: otherPayer, amount: -500000 },
              { account: "0.0.3", amount: 500000 },
            ],
            name: "CRYPTOUPDATEACCOUNT",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      // the STAKE family reads `fee` as its balance delta, so a foreign fee would debit the account
      expect(result.coinOperations).toMatchObject([
        { type: "STAKE", value: new BigNumber(0), fee: new BigNumber(0) },
      ]);
    });
  });

  describe("FEES operation recipients", () => {
    const listArgs = {
      limit: mockLimit,
      order: mockOrder as "desc",
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
    };

    it("falls back to the credited network account when the transaction has no node", async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1625097600.000000000",
            transaction_hash: "hash1",
            charged_tx_fee: 500000,
            transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
            token_transfers: [],
            staking_reward_transfers: [],
            // mirror leaves `node` null on child records, which only move the fee
            nonce: 1,
            node: null,
            transfers: [
              { account: mockMirrorAccount.account, amount: -500000 },
              { account: "0.0.98", amount: 400000 },
              { account: "0.0.800", amount: 50000 },
              { account: "0.0.801", amount: 50000 },
            ],
            name: "CRYPTOCREATEACCOUNT",
          }),
        ],
        nextCursor: null,
      });

      const result = await listOperations(listArgs);

      // an empty recipients list would read as a fee paid to nobody
      expect(result.coinOperations).toMatchObject([
        {
          type: "FEES",
          value: new BigNumber(500000),
          senders: [mockMirrorAccount.account],
          recipients: ["0.0.98"],
        },
      ]);
    });
  });

  describe("failed transactions", () => {
    it("stays an OUT charged the transaction fee when the account paid it", async () => {
      const mockTransaction = getMockedMirrorTransaction({
        consensus_timestamp: "1625097600.000000000",
        transaction_hash: "hash1",
        charged_tx_fee: 500000,
        result: "INSUFFICIENT_ACCOUNT_BALANCE",
        transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
        token_transfers: [],
        staking_reward_transfers: [],
        // a failed transaction moves no value, only the fee
        transfers: [
          { account: mockMirrorAccount.account, amount: -500000 },
          { account: "0.0.3", amount: 500000 },
        ],
        name: "CRYPTOTRANSFER",
      });

      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [mockTransaction],
        nextCursor: null,
      });

      const result = await listOperations({
        limit: mockLimit,
        order: mockOrder,
        currencyId: mockCurrency.id,
        address: mockMirrorAccount.account,
        evmAddress: mockMirrorAccount.evm_address,
        mirrorTokens: [],
        tokenEvmAddresses: [],
        fetchAllPages: true,
        skipFeesForTokenOperations: false,
        useEncodedHash: false,
        useSyntheticBlocks: false,
      });

      expect(result.coinOperations).toMatchObject([
        {
          id: "hash1:OUT",
          type: "OUT",
          hasFailed: true,
          value: new BigNumber(500000),
          fee: new BigNumber(500000),
        },
      ]);
    });
  });

  describe("incremental sync", () => {
    const listArgs = (cursor?: string) => ({
      limit: mockLimit,
      order: mockOrder as "desc",
      currencyId: mockCurrency.id,
      address: mockMirrorAccount.account,
      evmAddress: mockMirrorAccount.evm_address,
      mirrorTokens: [],
      tokenEvmAddresses: [],
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: false,
      useSyntheticBlocks: false,
      ...(cursor && { cursor }),
    });

    // two transactions inside one second: a cursor truncated to seconds re-fetches both
    const chain = [
      getMockedMirrorTransaction({
        consensus_timestamp: "1625097600.111222333",
        transaction_hash: "hash-early",
        charged_tx_fee: 500000,
        transaction_id: `${mockMirrorAccount.account}-1625097600.111222333`,
        transfers: [
          { account: mockMirrorAccount.account, amount: -1500000 },
          { account: "0.0.67890", amount: 1000000 },
        ],
      }),
      getMockedMirrorTransaction({
        consensus_timestamp: "1625097600.999888777",
        transaction_hash: "hash-late",
        charged_tx_fee: 500000,
        transaction_id: `${mockMirrorAccount.account}-1625097600.999888777`,
        transfers: [
          { account: mockMirrorAccount.account, amount: -2500000 },
          { account: "0.0.67890", amount: 2000000 },
        ],
      }),
    ];

    beforeEach(() => {
      // stands in for the mirror node's `timestamp=gt:` filter
      (apiClient.getAccountTransactions as jest.Mock).mockImplementation(({ pagingToken }) => ({
        transactions: pagingToken
          ? chain.filter(tx => new BigNumber(tx.consensus_timestamp).gt(pagingToken))
          : chain,
        nextCursor: null,
      }));
    });

    it("emits no operation twice when re-syncing with no new chain activity", async () => {
      const first = await listOperations(listArgs());
      expect(first.coinOperations).toHaveLength(2);

      const cursor = utils.getSyncCursor({ operations: first.coinOperations });
      const second = await listOperations(listArgs(cursor ?? undefined));

      expect(second.coinOperations).toEqual([]);
    });

    it("still picks up a transaction landing in the same second as the stored one", async () => {
      const stored = await listOperations(listArgs());
      const earlyOperation = stored.coinOperations.filter(op => op.hash === "hash-early");
      const cursor = utils.getSyncCursor({ operations: earlyOperation });

      const next = await listOperations(listArgs(cursor ?? undefined));

      expect(next.coinOperations.map(op => op.hash)).toEqual(["hash-late"]);
    });
  });
});
