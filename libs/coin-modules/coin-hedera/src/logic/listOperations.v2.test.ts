import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
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
  const mockMirrorAccount = getMockedMirrorAccount({ account: "0.0.12345" });
  const mockSyntheticBlock: SyntheticBlock = {
    blockHeight: 1000000,
    blockHash: "0x100000",
    blockTime: new Date(),
  };
  const mockLimit = 10;
  const mockOrder = "desc";

  function makeListOperationsParams(
    overrides: Partial<Parameters<typeof listOperations>[0]> = {},
  ): Parameters<typeof listOperations>[0] {
    return {
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
      ...overrides,
    };
  }

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(makeListOperationsParams());

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
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
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
        { account: "0.0.802", amount: 500000 },
      ],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toMatchObject([
      {
        type: "FEES",
        fee: expect.any(Object),
        senders: [mockMirrorAccount.account],
        recipients: ["0.0.3"],
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

  it("attributes the FEES op of an incoming transfer with user-paid fee to payer -> node", async () => {
    // user receives HBAR but is the fee payer (transaction_id starts with user's account)
    const fee = 100000;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: fee,
      node: "0.0.3",
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: 500000 - fee },
        { account: "0.0.9999", amount: -500000 },
        { account: "0.0.3", amount: fee },
      ],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toMatchObject([
      { type: "IN", senders: ["0.0.9999"], recipients: [mockMirrorAccount.account] },
      { type: "FEES", senders: [mockMirrorAccount.account], recipients: ["0.0.3"] },
    ]);
  });

  it("creates no FEES op for a multi-asset tx and keeps token ops un-nested", async () => {
    // HBAR value + HTS transfer in one CryptoTransfer => OUT coin op only
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      charged_tx_fee: 100000,
      node: "0.0.3",
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      staking_reward_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -600000 },
        { account: "0.0.67890", amount: 500000 },
        { account: "0.0.3", amount: 100000 },
      ],
      token_transfers: [
        {
          token_id: mockTokenHTS.contractAddress,
          account: mockMirrorAccount.account,
          amount: -1000,
        },
        { token_id: mockTokenHTS.contractAddress, account: "0.0.67890", amount: 1000 },
      ],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenHTS),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([expect.objectContaining({ type: "OUT" })]);
    expect(result.coinOperations.find(op => op.type === "FEES")).toBeUndefined();
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({ type: "OUT", standard: "hts" }),
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

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

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
      }),
    ]);
  });

  it("attributes the ERC20 FEES op to payer -> node, not to the token transfer parties", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const sharedHash = "erc20-fees-hash";
    const sharedTimestamp = "1625097600.000000000";

    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: sharedTimestamp,
      transaction_hash: sharedHash,
      transaction_id: `${mockMirrorAccount.account}-1625097600.000000000`,
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      node: "0.0.3",
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
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(mockTokenERC20),
      getTokensSyncHash: async () => "",
    });

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "FEES",
        senders: [mockMirrorAccount.account],
        recipients: ["0.0.3"],
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

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

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

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(
      makeListOperationsParams({ mirrorTokens: [mockMirrorToken] }),
    );

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
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
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
        { account: "0.0.802", amount: 500000 },
      ],
      name: "CRYPTOTRANSFER",
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations(makeListOperationsParams());

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

  it("should emit only a token operation when a token transfer has no HBAR transfers and zero fee", async () => {
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

    const result = await listOperations(makeListOperationsParams());

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

    await listOperations(
      makeListOperationsParams({ limit: customLimit, order: customOrder, cursor: lastPagingToken }),
    );

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(makeListOperationsParams());

    const rewardTimestamp = result.coinOperations[0].date.getTime();
    const mainTimestamp = result.coinOperations[1].date.getTime();

    expect(result.tokenOperations).toEqual([]);
    expect(rewardTimestamp).toBe(mainTimestamp + 1);
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

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([expect.objectContaining({ type: "IN" })]);
  });

  it("should produce two token operations for a swap with two different-token transfers", async () => {
    const sharedHash = "erc20-in-transfer-hash";
    const mockTokenA = getMockedERC20TokenCurrency({
      id: "hedera/erc20/0xTokenA",
      contractAddress: "0xTokenA",
    });
    const mockTokenB = getMockedERC20TokenCurrency({
      id: "hedera/erc20/0xTokenB",
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

    const result = await listOperations(
      makeListOperationsParams({
        tokenEvmAddresses: [mockTokenA.contractAddress, mockTokenB.contractAddress],
      }),
    );

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

    const result = await listOperations(
      makeListOperationsParams({
        skipFeesForTokenOperations: true,
      }),
    );

    expect(result.coinOperations).toHaveLength(0);
    expect(result.tokenOperations).toHaveLength(1);
    expect(result.tokenOperations[0].type).toBe("OUT");
  });

  it("should keep the standalone FEES op of a fee-only tx when skipFeesForTokenOperations is true", async () => {
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "hash1",
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
      charged_tx_fee: 500000,
      name: "CRYPTOAPPROVEALLOWANCE",
      transfers: [
        { account: mockMirrorAccount.account, amount: -500000 },
        { account: "0.0.98", amount: 500000 },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });

    const result = await listOperations(
      makeListOperationsParams({
        skipFeesForTokenOperations: true,
      }),
    );

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "FEES",
        hash: "hash1",
        value: new BigNumber(500000),
      }),
    ]);
    expect(result.tokenOperations).toHaveLength(0);
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

    const result = await listOperations(makeListOperationsParams({ useEncodedHash: true }));

    expect(result.coinOperations).toHaveLength(1);
    expect(result.coinOperations[0].hash).toBe("encoded-hash1");
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

    const result = await listOperations(makeListOperationsParams({ useSyntheticBlocks: true }));

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

    const result = await listOperations(
      makeListOperationsParams({
        tokenEvmAddresses: [mockTokenERC20.contractAddress],
        useSyntheticBlocks: true,
      }),
    );

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

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

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

    const result = await listOperations(makeListOperationsParams());

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

    const result = await listOperations(
      makeListOperationsParams({ tokenEvmAddresses: [mockTokenERC20.contractAddress] }),
    );

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

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toHaveLength(1);
    expect(result.coinOperations[0].recipients).toEqual([nodeAccountId]);
  });

  // Real-world data: https://mainnet.mirrornode.hedera.com/api/v1/transactions?timestamp=1760510879.300860000
  it("should split a multi-asset CryptoTransfer into one op per (asset, direction) with no FEES", async () => {
    const usdc = "0.0.456858";
    const hbark = "0.0.5022567";
    const receiver1 = "0.0.9124531";
    const receiver2 = "0.0.9169746";
    const fee = 1176695;

    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1760510879.300860000",
      transaction_id: `${mockMirrorAccount.account}-1760510879-300860000`,
      transaction_hash: "multiasset",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      // mirror sorts transfer rows by account id, so the node row (0.0.15) comes first
      transfers: [
        { account: "0.0.15", amount: 55631 },
        { account: "0.0.801", amount: 1121064 },
        { account: mockMirrorAccount.account, amount: -(2000000 + fee) },
        { account: receiver1, amount: 1000000 },
        { account: receiver2, amount: 1000000 },
      ],
      token_transfers: [
        { token_id: usdc, account: mockMirrorAccount.account, amount: -10000 },
        { token_id: usdc, account: receiver1, amount: 10000 },
        { token_id: hbark, account: mockMirrorAccount.account, amount: -2 },
        { token_id: hbark, account: receiver2, amount: 2 },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        value: new BigNumber(1000000 + fee),
        fee: new BigNumber(fee),
        senders: [mockMirrorAccount.account],
        recipients: [receiver2],
      }),
      expect.objectContaining({
        type: "OUT",
        value: new BigNumber(1000000 + fee),
        fee: new BigNumber(fee),
        senders: [mockMirrorAccount.account],
        recipients: [receiver1],
      }),
    ]);
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        contract: usdc,
        standard: "hts",
        value: new BigNumber(10000),
      }),
      expect.objectContaining({
        type: "OUT",
        contract: hbark,
        standard: "hts",
        value: new BigNumber(2),
      }),
    ]);
  });

  it("should fold the fee into a simple HBAR OUT (fee-inclusive value, no FEES op)", async () => {
    const fee = 500000;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
      transaction_hash: "simpleout",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -(1000000 + fee) },
        { account: "0.0.67890", amount: 1000000 },
        { account: "0.0.802", amount: fee },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        value: new BigNumber(1000000 + fee),
        fee: new BigNumber(fee),
        senders: [mockMirrorAccount.account],
        recipients: ["0.0.67890"],
      }),
    ]);
  });

  it("should emit HBAR IN + FEES for a swap where the user receives HBAR and pays the fee", async () => {
    const token = "0.0.7890";
    const fee = 100000;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
      transaction_hash: "swap",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      transfers: [
        { account: "0.0.67890", amount: -500000 },
        { account: mockMirrorAccount.account, amount: 500000 - fee },
        { account: "0.0.802", amount: fee },
      ],
      token_transfers: [
        { token_id: token, account: mockMirrorAccount.account, amount: -1000 },
        { token_id: token, account: "0.0.67890", amount: 1000 },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "IN",
        value: new BigNumber(500000),
        fee: new BigNumber(fee),
      }),
      expect.objectContaining({ type: "FEES", value: new BigNumber(fee), fee: new BigNumber(fee) }),
    ]);
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({ type: "OUT", contract: token, standard: "hts" }),
    ]);
  });

  it("should emit only IN (no FEES) for an incoming HBAR transfer when the user is not the payer", async () => {
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: "0.0.67890-1625097600-000000000",
      transaction_hash: "incoming",
      charged_tx_fee: 100000,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: "0.0.67890", amount: -1100000 },
        { account: mockMirrorAccount.account, amount: 1000000 },
        { account: "0.0.802", amount: 100000 },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue("0.0.67890");

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "IN",
        value: new BigNumber(1000000),
        fee: new BigNumber(100000),
        recipients: [mockMirrorAccount.account],
        senders: ["0.0.67890"],
      }),
    ]);
  });

  it("should list all net counterparties and never fee/node/system rows", async () => {
    const fee = 300000;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
      transaction_hash: "multirecipient",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -(3000000 + fee) },
        { account: "0.0.9124531", amount: 1000000 },
        { account: "0.0.9169746", amount: 1000000 },
        { account: "0.0.9200000", amount: 1000000 },
        { account: "0.0.800", amount: 100000 },
        { account: "0.0.801", amount: 100000 },
        { account: "0.0.802", amount: 100000 },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations.map(op => op.recipients)).toEqual([
      ["0.0.9200000"],
      ["0.0.9169746"],
      ["0.0.9124531"],
    ]);
    const allRecipients = result.coinOperations.flatMap(op => op.recipients);
    expect(allRecipients).not.toContain("0.0.800");
    expect(allRecipients).not.toContain("0.0.801");
    expect(allRecipients).not.toContain("0.0.802");
  });

  // Real-world data: testnet tx 0.0.6136753-1783676710-421838210
  it("should split a sole-sender multi-receiver HBAR transfer into one OUT per recipient", async () => {
    const fee = 284122;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1783676722.704196728",
      transaction_id: `${mockMirrorAccount.account}-1783676710-421838210`,
      transaction_hash: "multireceiver",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: "0.0.802", amount: fee },
        { account: mockMirrorAccount.account, amount: -(2000000 + fee) },
        { account: "0.0.6855655", amount: 1000000 },
        { account: "0.0.9509310", amount: 1000000 },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.tokenOperations).toEqual([]);
    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        id: "multireceiver:OUT:0.0.9509310",
        type: "OUT",
        value: new BigNumber(1000000 + fee),
        fee: new BigNumber(fee),
        senders: [mockMirrorAccount.account],
        recipients: ["0.0.9509310"],
      }),
      expect.objectContaining({
        id: "multireceiver:OUT:0.0.6855655",
        type: "OUT",
        value: new BigNumber(1000000 + fee),
        fee: new BigNumber(fee),
        senders: [mockMirrorAccount.account],
        recipients: ["0.0.6855655"],
      }),
    ]);
  });

  it("should keep a single netted OUT when the user is not the sole sender (many-to-many)", async () => {
    const fee = 300000;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
      transaction_hash: "manytomany",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -(1000000 + fee) },
        { account: "0.0.55555", amount: -1000000 },
        { account: "0.0.9124531", amount: 1500000 },
        { account: "0.0.9169746", amount: 500000 },
        { account: "0.0.802", amount: fee },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        id: "manytomany:OUT",
        type: "OUT",
        value: new BigNumber(1000000 + fee),
        fee: new BigNumber(fee),
        senders: ["0.0.55555", mockMirrorAccount.account],
        recipients: ["0.0.9169746", "0.0.9124531"],
      }),
    ]);
  });

  it("should not fold the fee into a co-sender's OUT value when another account paid it (many-to-many)", async () => {
    const payerAccount = "0.0.55555";
    const fee = 300000;
    const recipient1 = "0.0.9124531";
    const recipient2 = "0.0.9169746";

    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: `${payerAccount}-1625097600-000000000`,
      transaction_hash: "manytomany-nonpayer",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: payerAccount, amount: -(2000000 + fee) },
        { account: mockMirrorAccount.account, amount: -1000000 },
        { account: recipient1, amount: 1500000 },
        { account: recipient2, amount: 1500000 },
        { account: "0.0.802", amount: fee },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(payerAccount);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        id: "manytomany-nonpayer:OUT",
        type: "OUT",
        value: new BigNumber(1000000),
        fee: new BigNumber(fee),
        senders: [mockMirrorAccount.account, payerAccount],
        recipients: [recipient2, recipient1],
      }),
    ]);
  });

  it("should split a sole-sender multi-receiver token transfer into one OUT per recipient", async () => {
    const tokenId = "0.0.7890";
    const fee = 100000;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: `${mockMirrorAccount.account}-1625097600-000000000`,
      transaction_hash: "tokenmultireceiver",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [
        { token_id: tokenId, account: mockMirrorAccount.account, amount: -3000 },
        { token_id: tokenId, account: "0.0.67890", amount: 1000 },
        { token_id: tokenId, account: "0.0.67891", amount: 2000 },
      ],
      transfers: [
        { account: mockMirrorAccount.account, amount: -fee },
        { account: "0.0.802", amount: fee },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue(mockMirrorAccount.account);

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([expect.objectContaining({ type: "FEES" })]);
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        id: "tokenmultireceiver:OUT:0.0.7890:0.0.67891",
        type: "OUT",
        contract: tokenId,
        standard: "hts",
        value: new BigNumber(2000),
        recipients: ["0.0.67891"],
      }),
      expect.objectContaining({
        id: "tokenmultireceiver:OUT:0.0.7890:0.0.67890",
        type: "OUT",
        contract: tokenId,
        standard: "hts",
        value: new BigNumber(1000),
        recipients: ["0.0.67890"],
      }),
    ]);
  });

  it("should flag isApproval on a token op when the user's tokens were moved via an allowance", async () => {
    const token = "0.0.7890";
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: "0.0.999999-1625097600-000000000",
      transaction_hash: "allowance",
      charged_tx_fee: 100000,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      transfers: [
        { account: "0.0.999999", amount: -100000 },
        { account: "0.0.802", amount: 100000 },
      ],
      token_transfers: [
        { token_id: token, account: mockMirrorAccount.account, amount: -1000, is_approval: true },
        { token_id: token, account: "0.0.67890", amount: 1000 },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue("0.0.999999");

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([]);
    expect(result.tokenOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        contract: token,
        standard: "hts",
        extra: expect.objectContaining({ isApproval: true }),
      }),
    ]);
  });

  it("should flag isApproval on a native HBAR OUT op when the user's HBAR was moved via an allowance", async () => {
    const fee = 500000;
    const mockTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_id: "0.0.999999-1625097600-000000000",
      transaction_hash: "hbarallowance",
      charged_tx_fee: fee,
      result: "SUCCESS",
      name: "CRYPTOTRANSFER",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        { account: mockMirrorAccount.account, amount: -1000000, is_approval: true },
        { account: "0.0.67890", amount: 1000000 },
        { account: "0.0.802", amount: fee },
        { account: "0.0.999999", amount: -fee },
      ],
    });

    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [mockTransaction],
      nextCursor: null,
    });
    (utils.extractFeesPayer as jest.Mock).mockReturnValue("0.0.999999");

    const result = await listOperations(makeListOperationsParams());

    expect(result.coinOperations).toEqual([
      expect.objectContaining({
        type: "OUT",
        value: new BigNumber(1000000),
        recipients: ["0.0.67890"],
        extra: expect.objectContaining({ isApproval: true }),
      }),
    ]);
  });
});
