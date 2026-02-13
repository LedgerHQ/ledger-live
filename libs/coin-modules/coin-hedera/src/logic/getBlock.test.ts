import { FINALITY_MS, HEDERA_TRANSACTION_NAMES } from "../constants";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import type { StakingAnalysis } from "../types";
import { analyzeStakingOperation, getDateRangeFromBlockHeight } from "./utils";

jest.mock("./getBlockInfo");
jest.mock("../network/api");
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  analyzeStakingOperation: jest.fn(),
  getDateRangeFromBlockHeight: jest.fn(),
  getMemoFromBase64: jest.fn(),
}));

describe("getBlock", () => {
  const mockBlockInfo = {
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
    (getBlockInfo as jest.Mock).mockResolvedValue(mockBlockInfo);
    (getDateRangeFromBlockHeight as jest.Mock).mockReturnValue(mockDateRange);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(null);
  });

  it("should return empty block when no transactions exist", async () => {
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    const result = await getBlock(100);

    expect(result).toEqual({
      info: mockBlockInfo,
      transactions: [],
    });
  });

  it("should call dependencies with correct parameters", async () => {
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    await getBlock(42);

    expect(getDateRangeFromBlockHeight).toHaveBeenCalledWith(42);
    expect(getBlockInfo).toHaveBeenCalledWith(42);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith({
      startTimestamp: `gte:1704067200.123`,
      endTimestamp: `lt:1704067260.456`,
    });
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

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);
    const senderOperation = result.transactions[0].operations.find(op => op.address === "0.0.999");

    expect(senderOperation).toMatchObject({
      address: "0.0.999",
      amount: BigInt(-567179 + 67179),
    });
  });

  it("should handle token transfers", async () => {
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
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "SUCCESS",
      charged_tx_fee: 100000,
      staking_reward_transfers: [
        {
          account: "0.0.999",
          amount: 100000,
        },
        {
          account: "0.0.1001",
          amount: 200000,
        },
      ],
      transfers: [
        {
          account: "0.0.999",
          amount: -600000,
        },
        {
          account: "0.0.1001",
          amount: 500000,
        },
      ],
      token_transfers: [],
    };

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);

    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: "0.0.999",
        asset: { type: "native" },
        amount: BigInt(-500000),
      },
      {
        type: "transfer",
        address: "0.0.1001",
        asset: { type: "native" },
        amount: BigInt(500000),
      },
      {
        type: "transfer",
        address: "0.0.999",
        asset: { type: "native" },
        amount: BigInt(100000),
      },
      {
        type: "transfer",
        address: "0.0.1001",
        asset: { type: "native" },
        amount: BigInt(200000),
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
