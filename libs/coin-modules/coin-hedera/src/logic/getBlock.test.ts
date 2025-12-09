import { HEDERA_TRANSACTION_NAMES } from "../constants";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import { thirdwebClient } from "../network/thirdweb";
import * as networkUtils from "../network/utils";
import { getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedMirrorTransaction } from "../test/fixtures/mirror.fixture";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import type { OperationERC20, StakingAnalysis } from "../types";
import { analyzeStakingOperation, getTimestampRangeFromBlockHeight, fromEVMAddress } from "./utils";

jest.mock("./getBlockInfo");
jest.mock("../network/api");
jest.mock("../network/thirdweb");
jest.mock("./utils");

describe("getBlock", () => {
  const mockBlockInfo = {
    height: 100,
    hash: "mock_hash",
    time: new Date("2024-01-01T00:00:00Z"),
  };

  const mockTimestampRange = {
    mirror: {
      start: "170406720.000000000",
      end: "170406730.000000000",
    },
    thirdweb: {
      start: "170406720",
      end: "170406729",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    (getBlockInfo as jest.Mock).mockResolvedValue(mockBlockInfo);
    (getTimestampRangeFromBlockHeight as jest.Mock).mockReturnValue(mockTimestampRange);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(null);
    (fromEVMAddress as jest.Mock).mockImplementation((evmAddress: string) => {
      const addressMap: Record<string, string> = {
        "0x0000000000000000000000000000000000000999": "0.0.999",
        "0x0000000000000000000000000000000000001001": "0.0.1001",
      };
      return addressMap[evmAddress] || null;
    });
  });

  it("should return empty block when no transactions exist", async () => {
    (thirdwebClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    const result = await getBlock(100);

    expect(result).toEqual({
      info: mockBlockInfo,
      transactions: [],
    });
  });

  it("should call dependencies with correct parameters", async () => {
    (thirdwebClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    await getBlock(42);

    expect(getTimestampRangeFromBlockHeight).toHaveBeenCalledWith(42);
    expect(getBlockInfo).toHaveBeenCalledWith(42);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith(
      mockTimestampRange.mirror.start,
      mockTimestampRange.mirror.end,
    );
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

    (thirdwebClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);
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

    (thirdwebClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);
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
      amount: BigInt(100),
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
      amount: mockStakingAnalysis.amount,
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
      amount: BigInt(100),
    };

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);
    (analyzeStakingOperation as jest.Mock).mockResolvedValue(mockStakingAnalysis);

    const result = await getBlock(100);

    expect(result.transactions[0].operations[0]).toEqual({
      type: "other",
      operationType: mockStakingAnalysis.operationType,
      stakedNodeId: mockStakingAnalysis.targetStakingNodeId,
      previousStakedNodeId: mockStakingAnalysis.previousStakingNodeId,
      amount: mockStakingAnalysis.amount,
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
      amount: BigInt(100),
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
        amount: mockStakingAnalysis.amount,
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

  it("should handle ERC20 token transfers", async () => {
    const mockERC20Token = getMockedERC20TokenCurrency({
      contractAddress: "0x0000000000000000000000000000000000012345",
    });
    const mockMirrorTx = getMockedMirrorTransaction({
      transaction_id: "0.0.999-1704067200-000000000",
      charged_tx_fee: 50000,
      name: "CONTRACTCALL",
      result: "SUCCESS",
      staking_reward_transfers: [],
      token_transfers: [],
      transfers: [
        {
          account: "0.0.999",
          amount: -50000,
        },
      ],
    });
    const mockThirdwebTx = getMockedThirdwebTransaction({
      transactionHash: "hash_erc20",
      blockTimestamp: 1704067200,
      data: "0x00000000000000000000000000000000000000000000000000000000000003e8",
      topics: [
        "0xa9059cbb",
        "0x0000000000000000000000000000000000000000000000000000000000000999",
        "0x0000000000000000000000000000000000000000000000000000000000001001",
      ],
    });
    const mockERC20Operation: OperationERC20 = {
      thirdwebTransaction: mockThirdwebTx,
      mirrorTransaction: mockMirrorTx,
      token: mockERC20Token,
      contractCallResult: {} as any,
    };

    (thirdwebClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([
      mockThirdwebTx,
    ]);
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockMirrorTx]);
    jest.spyOn(networkUtils, "getERC20Operations").mockResolvedValue([mockERC20Operation]);
    jest.spyOn(networkUtils, "parseThirdwebTransactionParams").mockReturnValue({
      from: "0x0000000000000000000000000000000000000999",
      to: "0x0000000000000000000000000000000000001001",
      value: "1000",
    });

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: "0.0.999",
        amount: BigInt(0), // -50000 + 50000 (fee excluded)
        asset: { type: "native" },
      },
      {
        type: "transfer",
        address: "0.0.999",
        amount: BigInt(-1000),
        asset: {
          type: "erc20",
          assetReference: mockERC20Token.contractAddress,
        },
      },
      {
        type: "transfer",
        address: "0.0.1001",
        amount: BigInt(1000),
        asset: {
          type: "erc20",
          assetReference: mockERC20Token.contractAddress,
        },
      },
    ]);
  });
});
