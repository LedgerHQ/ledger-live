import { BigNumber } from "bignumber.js";
import type { BlockInfo } from "@ledgerhq/coin-framework/api/types";
import { getEnv } from "@ledgerhq/live-env";
import { HEDERA_TRANSACTION_NAMES, FINALITY_MS } from "../constants";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { enrichERC20Transfers } from "../network/utils";
import type { StakingAnalysis } from "../types";
import { analyzeStakingOperation, getDateRangeFromBlockHeight } from "./utils";
import { getMockedEnrichedERC20Transfer } from "../test/fixtures/common.fixture";
import { getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedERC20TokenTransfer } from "../test/fixtures/hgraph.fixture";
import {
  getMockedMirrorAccount,
  getMockedMirrorContractCallResult,
  getMockedMirrorTransaction,
} from "../test/fixtures/mirror.fixture";

jest.mock("./getBlockInfo");
jest.mock("../network/api");
jest.mock("../network/hgraph");
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  getDateRangeFromBlockHeight: jest.fn(),
  analyzeStakingOperation: jest.fn().mockResolvedValue(null),
  fromEVMAddress: jest.fn().mockImplementation((evmAddress: string) => {
    const addressMap: Record<string, string> = {
      "0x0000000000000000000000000000000000000999": "0.0.999",
      "0x0000000000000000000000000000000000001001": "0.0.1001",
    };
    return addressMap[evmAddress] || null;
  }),
}));
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  enrichERC20Transfers: jest.fn(),
}));

describe("getBlock", () => {
  const mockBlockInfo: BlockInfo = {
    height: 100,
    hash: "mock_hash",
    time: new Date("2024-01-01T00:00:00Z"),
  };

  const mockDateRange = {
    start: new Date(1704067200123),
    end: new Date(1704067260456),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    (getBlockInfo as jest.Mock).mockResolvedValue(mockBlockInfo);
    (getDateRangeFromBlockHeight as jest.Mock).mockReturnValue(mockDateRange);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(null);
    (enrichERC20Transfers as jest.Mock).mockReturnValue([]);
    (hgraphClient.getLastestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber("1704067200123.000000000"),
    );
  });

  it("should return empty block when no transactions exist", async () => {
    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    const result = await getBlock(100);

    expect(result).toEqual({
      info: mockBlockInfo,
      transactions: [],
    });
  });

  it("should call dependencies with correct parameters", async () => {
    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    await getBlock(42);

    expect(getDateRangeFromBlockHeight).toHaveBeenCalledWith(42);
    expect(getBlockInfo).toHaveBeenCalledWith(42);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith({
      startTimestamp: `gte:1704067200.123`,
      endTimestamp: `lt:1704067260.456`,
      limit: 100,
      order: "desc",
    });
    expect(hgraphClient.getERC20TransfersByTimestampRange).toHaveBeenCalledTimes(1);
    expect(hgraphClient.getERC20TransfersByTimestampRange).toHaveBeenCalledWith({
      startTimestamp: "1704067200.123000000",
      endTimestamp: "1704067260.456000000",
      limit: 100,
      order: "desc",
    });
    expect(enrichERC20Transfers).toHaveBeenCalledTimes(1);
    expect(hgraphClient.getLastestIndexedConsensusTimestamp).toHaveBeenCalledTimes(1);
  });

  it("should extract fee payer from transaction_id", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "SUCCESS",
      charged_tx_fee: 100000,
      staking_reward_transfers: [],
      transfers: [],
      token_transfers: [],
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);

    expect(result.transactions[0].feesPayer).toBe("0.0.999");
  });

  it("should exclude fee from payer's operation amount", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "SUCCESS",
      charged_tx_fee: 67179,
      staking_reward_transfers: [],
      transfers: [
        {
          account: "0.0.999",
          amount: -567179,
        },
        {
          account: "0.0.1001",
          amount: 500000,
        },
      ],
      token_transfers: [],
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);
    const senderOperation = result.transactions[0].operations.find(op => op.address === "0.0.999");

    expect(senderOperation).toMatchObject({
      address: "0.0.999",
      amount: BigInt(-567179 + 67179),
    });
  });

  it("should handle HTS token transfers", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "SUCCESS",
      charged_tx_fee: 100000,
      staking_reward_transfers: [],
      transfers: [],
      token_transfers: [
        {
          token_id: "0.0.12345",
          account: "0.0.999",
          amount: -1000,
        },
        {
          token_id: "0.0.12345",
          account: "0.0.1001",
          amount: 1000,
        },
      ],
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);

    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: "0.0.999",
        asset: {
          type: "hts",
          assetReference: "0.0.12345",
        },
        amount: BigInt(-1000),
      },
      {
        type: "transfer",
        address: "0.0.1001",
        asset: {
          type: "hts",
          assetReference: "0.0.12345",
        },
        amount: BigInt(1000),
      },
    ]);
  });

  it("should handle ERC20 token transfers", async () => {
    const mockMirrorAccount = getMockedMirrorAccount({ account: "0.0.12345" });
    const mockTokenERC20 = getMockedERC20TokenCurrency();

    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "erc20-transfer-hash",
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      memo_base64: "xyz",
      staking_reward_transfers: [],
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

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([
      mockMirrorTransaction,
    ]);
    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([
      mockERC20Transfer,
    ]);
    (enrichERC20Transfers as jest.Mock).mockReturnValue([mockEnrichedERC20Transfer]);

    const result = await getBlock(100);

    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: "0.0.12345",
        asset: {
          type: "native",
        },
        amount: BigInt(-300000),
      },
      {
        type: "transfer",
        address: "0.0.67890",
        asset: {
          type: "erc20",
          assetReference: mockTokenERC20.contractAddress,
        },
        amount: BigInt(mockERC20Transfer.amount),
      },
      {
        type: "transfer",
        address: "0.0.12345",
        asset: {
          type: "erc20",
          assetReference: mockTokenERC20.contractAddress,
        },
        amount: BigInt(-mockERC20Transfer.amount),
      },
    ]);
  });

  it("should deduplicate CONTRACT_CALL when matching ERC20 transfer exists", async () => {
    const mockMirrorAccount = getMockedMirrorAccount({ account: "0.0.12345" });
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const sharedHash = "duplicate-hash";
    const sharedTimestamp = "1625097600.000000000";

    const mockMirrorContractCall = getMockedMirrorTransaction({
      consensus_timestamp: sharedTimestamp,
      transaction_hash: sharedHash,
      transaction_id: "0.0.12345-1625097600-000000000",
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

    const mockContractCallResult = getMockedMirrorContractCallResult();

    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorContractCall,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([
      mockMirrorContractCall,
    ]);
    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([
      mockERC20Transfer,
    ]);
    (enrichERC20Transfers as jest.Mock).mockReturnValue([mockEnrichedERC20Transfer]);

    const result = await getBlock(100);

    expect(result.transactions).toEqual([expect.objectContaining({ hash: sharedHash })]);
  });

  it("should handle ERC20 transfer with null account_ids (using EVM addresses only)", async () => {
    const mockMirrorAccount = getMockedMirrorAccount({ account: "0.0.12345" });
    const mockTokenERC20 = getMockedERC20TokenCurrency();

    const mockMirrorTransaction = getMockedMirrorTransaction({
      consensus_timestamp: "1625097600.000000000",
      transaction_hash: "erc20-transfer-hash",
      charged_tx_fee: 300000,
      result: "SUCCESS",
      name: "CONTRACTCALL",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [{ account: mockMirrorAccount.account, amount: -300000 }],
    });

    const mockERC20Transfer = getMockedERC20TokenTransfer({
      token_evm_address: mockTokenERC20.contractAddress,
      transaction_hash: mockMirrorTransaction.transaction_hash,
      consensus_timestamp:
        Number(mockMirrorTransaction.consensus_timestamp.split(".")[0]) * 10 ** 9,
      sender_account_id: null,
      receiver_account_id: null,
      sender_evm_address: "0x0000000000000000000000000000000000000999",
      receiver_evm_address: "0x0000000000000000000000000000000000001001",
      payer_account_id: 12345,
      amount: 5000000,
    });

    const mockContractCallResult = getMockedMirrorContractCallResult();

    const mockEnrichedERC20Transfer = getMockedEnrichedERC20Transfer({
      mirrorTransaction: mockMirrorTransaction,
      contractCallResult: mockContractCallResult,
      transfer: mockERC20Transfer,
    });

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([
      mockMirrorTransaction,
    ]);
    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([
      mockERC20Transfer,
    ]);
    (enrichERC20Transfers as jest.Mock).mockReturnValue([mockEnrichedERC20Transfer]);

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].operations).toEqual([
      {
        address: mockMirrorAccount.account,
        amount: BigInt(-300000),
        asset: {
          type: "native",
        },
        type: "transfer",
      },
      {
        type: "transfer",
        address: mockERC20Transfer.receiver_evm_address,
        asset: {
          type: "erc20",
          assetReference: mockTokenERC20.contractAddress,
        },
        amount: BigInt(mockERC20Transfer.amount),
      },
      {
        type: "transfer",
        address: mockERC20Transfer.sender_evm_address,
        asset: {
          type: "erc20",
          assetReference: mockTokenERC20.contractAddress,
        },
        amount: BigInt(-mockERC20Transfer.amount),
      },
    ]);
  });

  it("should mark failed transactions", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "INSUFFICIENT_ACCOUNT_BALANCE",
      charged_tx_fee: 100000,
      staking_reward_transfers: [],
      transfers: [],
      token_transfers: [],
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);

    expect(result.transactions[0].failed).toBe(true);
  });

  it("should analyze CRYPTOUPDATEACCOUNT transactions for staking", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash_update",
      name: HEDERA_TRANSACTION_NAMES.UpdateAccount,
      result: "SUCCESS",
      charged_tx_fee: 22000,
      consensus_timestamp: "1704067210.123456789",
      staking_reward_transfers: [],
      transfers: [],
      token_transfers: [],
    };
    const mockStakingAnalysis: StakingAnalysis = {
      operationType: "DELEGATE",
      targetStakingNodeId: 5,
      previousStakingNodeId: null,
      stakedAmount: BigInt(100),
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await getBlock(100);

    expect(analyzeStakingOperation).toHaveBeenCalledTimes(1);
    expect(analyzeStakingOperation).toHaveBeenCalledWith("0.0.999", mockTx);
    expect(result.transactions[0].operations).toHaveLength(1);
    expect(result.transactions[0].operations[0]).toEqual({
      type: "other",
      operationType: mockStakingAnalysis.operationType,
      stakedNodeId: mockStakingAnalysis.targetStakingNodeId,
      previousStakedNodeId: mockStakingAnalysis.previousStakingNodeId,
      stakedAmount: mockStakingAnalysis.stakedAmount,
    });
  });

  it("should handle UNDELEGATE staking operation", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash_undelegate",
      name: HEDERA_TRANSACTION_NAMES.UpdateAccount,
      result: "SUCCESS",
      charged_tx_fee: 22000,
      consensus_timestamp: "1704067210.123456789",
      staking_reward_transfers: [],
      transfers: [],
      token_transfers: [],
    };
    const mockStakingAnalysis: StakingAnalysis = {
      operationType: "UNDELEGATE",
      targetStakingNodeId: null,
      previousStakingNodeId: 3,
      stakedAmount: BigInt(100),
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await getBlock(100);

    expect(result.transactions[0].operations[0]).toEqual({
      type: "other",
      operationType: mockStakingAnalysis.operationType,
      stakedNodeId: mockStakingAnalysis.targetStakingNodeId,
      previousStakedNodeId: mockStakingAnalysis.previousStakingNodeId,
      stakedAmount: mockStakingAnalysis.stakedAmount,
    });
  });

  it("should handle REDELEGATE staking operation", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash_redelegate",
      name: HEDERA_TRANSACTION_NAMES.UpdateAccount,
      result: "SUCCESS",
      charged_tx_fee: 22000,
      consensus_timestamp: "1704067210.123456789",
      staking_reward_transfers: [],
      transfers: [],
      token_transfers: [],
    };
    const mockStakingAnalysis: StakingAnalysis = {
      operationType: "REDELEGATE",
      targetStakingNodeId: 10,
      previousStakingNodeId: 5,
      stakedAmount: BigInt(100),
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await getBlock(100);

    expect(result.transactions[0].operations).toEqual([
      {
        type: "other",
        operationType: mockStakingAnalysis.operationType,
        stakedNodeId: mockStakingAnalysis.targetStakingNodeId,
        previousStakedNodeId: mockStakingAnalysis.previousStakingNodeId,
        stakedAmount: mockStakingAnalysis.stakedAmount,
      },
    ]);
  });

  it("should create CLAIM_REWARDS operations for staking reward transfers", async () => {
    const account1 = "0.0.999";
    const account2 = "0.0.1001";
    const stakingRewardAccount = getEnv("HEDERA_STAKING_REWARD_ACCOUNT_ID");
    const rewardAccount1 = 30313674;
    const rewardAccount2 = 191772;
    const chargedFee = 79874;

    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "SUCCESS",
      charged_tx_fee: chargedFee,
      staking_reward_transfers: [
        {
          account: account1,
          amount: rewardAccount1,
        },
        {
          account: account2,
          amount: rewardAccount2,
        },
      ],
      transfers: [
        {
          account: "0.0.35",
          amount: 3235,
        },
        {
          account: stakingRewardAccount,
          amount: -30505446,
        },
        {
          account: "0.0.801",
          amount: 76639,
        },
        {
          account: account1,
          amount: 29233800,
        },
        {
          account: account2,
          amount: 1191772,
        },
      ],
      token_transfers: [],
    };

    const totalRewards = mockTx.staking_reward_transfers.reduce((acc, t) => acc + t.amount, 0);

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);

    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: "0.0.35",
        asset: { type: "native" },
        amount: BigInt(3235),
      },
      {
        type: "transfer",
        address: stakingRewardAccount,
        asset: { type: "native" },
        amount: BigInt(-totalRewards),
      },
      {
        type: "transfer",
        address: "0.0.801",
        asset: { type: "native" },
        amount: BigInt(76639),
      },
      {
        type: "transfer",
        address: account1,
        asset: { type: "native" },
        amount: BigInt(29233800 + chargedFee - rewardAccount1),
      },
      {
        type: "transfer",
        address: account2,
        asset: { type: "native" },
        amount: BigInt(1191772 - rewardAccount2),
      },
      {
        type: "transfer",
        address: account1,
        asset: { type: "native" },
        amount: BigInt(rewardAccount1),
      },
      {
        type: "transfer",
        address: account2,
        asset: { type: "native" },
        amount: BigInt(rewardAccount2),
      },
    ]);
  });

  it("should handle CRYPTOUPDATEACCOUNT if it's not related to staking", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash_regular_update",
      name: HEDERA_TRANSACTION_NAMES.UpdateAccount,
      result: "SUCCESS",
      charged_tx_fee: 22000,
      consensus_timestamp: "1704067210.123456789",
      staking_reward_transfers: [],
      transfers: [
        {
          account: "0.0.999",
          amount: -23000,
        },
        {
          account: "0.0.1000",
          amount: 1000,
        },
      ],
      token_transfers: [],
    };

    (hgraphClient.getERC20TransfersByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(null);

    const result = await getBlock(100);

    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: "0.0.999",
        asset: { type: "native" },
        amount: BigInt(-1000),
      },
      {
        type: "transfer",
        address: "0.0.1000",
        asset: { type: "native" },
        amount: BigInt(1000),
      },
    ]);
  });

  it("should throw error when querying a block in the future", async () => {
    const now = Date.now();
    const futureRange = {
      start: new Date(now + 60_000),
      end: new Date(now + 120_000),
    };

    (getDateRangeFromBlockHeight as jest.Mock).mockReturnValue(futureRange);

    await expect(getBlock(999)).rejects.toThrow("Block 999 is not available yet");
    expect(getBlockInfo).not.toHaveBeenCalled();
    expect(apiClient.getTransactionsByTimestampRange).not.toHaveBeenCalled();
  });

  it("should throw error when querying a block overlapping the non-finalized window", async () => {
    const now = Date.now();
    const overlappingRange = {
      start: new Date(now - FINALITY_MS - 1_000),
      end: new Date(now - FINALITY_MS / 2),
    };

    (getDateRangeFromBlockHeight as jest.Mock).mockReturnValue(overlappingRange);

    await expect(getBlock(998)).rejects.toThrow("Block 998 is not available yet");
    expect(getBlockInfo).not.toHaveBeenCalled();
    expect(apiClient.getTransactionsByTimestampRange).not.toHaveBeenCalled();
  });

  it("should succeed when querying the finalized window", async () => {
    const now = Date.now();
    const finalizedRange = {
      start: new Date(now - FINALITY_MS - 120_000),
      end: new Date(now - FINALITY_MS - 60_000),
    };

    (getDateRangeFromBlockHeight as jest.Mock).mockReturnValue(finalizedRange);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    const result = await getBlock(100);

    expect(result).toEqual({
      info: mockBlockInfo,
      transactions: [],
    });
    expect(getBlockInfo).toHaveBeenCalledWith(100);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalled();
  });
});
