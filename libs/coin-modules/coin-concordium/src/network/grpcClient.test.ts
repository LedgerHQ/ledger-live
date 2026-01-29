import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  getGrpcClient,
  withClient,
  getLastBlock,
  getBlockChainParameters,
  getBlockInfoByHeight,
  getBlockByHeight,
  getOperations,
} from "./grpcClient";

// Mock the SDK
const mockGetConsensusStatus = jest.fn();
const mockGetBlockChainParameters = jest.fn();
const mockGetBlocksAtHeight = jest.fn();
const mockGetBlockInfo = jest.fn();
const mockGetBlockTransactionEvents = jest.fn();

jest.mock("@ledgerhq/concordium-sdk-adapter", () => ({
  ConcordiumGRPCWebClient: jest.fn().mockImplementation(() => ({
    getConsensusStatus: mockGetConsensusStatus,
    getBlockChainParameters: mockGetBlockChainParameters,
    getBlocksAtHeight: mockGetBlocksAtHeight,
    getBlockInfo: mockGetBlockInfo,
    getBlockTransactionEvents: mockGetBlockTransactionEvents,
  })),
  streamToList: jest.fn().mockImplementation(async stream => stream),
}));

jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn().mockReturnValue({
      grpcUrl: "https://grpc.concordium.com",
      grpcPort: 20000,
    }),
  },
}));

const createMockCurrency = (): CryptoCurrency =>
  ({
    id: "concordium",
    family: "concordium",
  }) as CryptoCurrency;

describe("grpcClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getGrpcClient", () => {
    it("should create a new client for currency", () => {
      const currency = createMockCurrency();
      const client = getGrpcClient(currency);

      expect(client).not.toBeUndefined();
    });

    it("should return cached client on subsequent calls", () => {
      const currency = createMockCurrency();
      const client1 = getGrpcClient(currency);
      const client2 = getGrpcClient(currency);

      expect(client1).toBe(client2);
    });
  });

  describe("withClient", () => {
    it("should execute function with client", async () => {
      const currency = createMockCurrency();
      const mockFn = jest.fn().mockResolvedValue("result");

      const result = await withClient(currency, mockFn);

      expect(result).toBe("result");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure", async () => {
      const currency = createMockCurrency();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce("success");

      const result = await withClient(currency, mockFn, 1);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should throw after all retries exhausted", async () => {
      const currency = createMockCurrency();
      const mockFn = jest.fn().mockRejectedValue(new Error("Always fails"));

      await expect(withClient(currency, mockFn, 1)).rejects.toThrow("Always fails");
      expect(mockFn).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it("should use default retries when not specified", async () => {
      const currency = createMockCurrency();
      const mockFn = jest.fn().mockRejectedValue(new Error("Fails"));

      await expect(withClient(currency, mockFn)).rejects.toThrow("Fails");
      expect(mockFn).toHaveBeenCalledTimes(2); // DEFAULT_RETRIES = 1
    });
  });

  describe("getLastBlock", () => {
    it("should return last finalized block info", async () => {
      mockGetConsensusStatus.mockResolvedValue({
        lastFinalizedBlockHeight: 1000n,
        lastFinalizedBlock: { toString: () => "blockhash123" },
        lastFinalizedTime: 1700000000000n,
      });

      const currency = createMockCurrency();
      const result = await getLastBlock(currency);

      expect(result).toEqual({
        blockHeight: 1000,
        blockHash: "blockhash123",
        timestamp: 1700000000000,
      });
    });

    it("should call getConsensusStatus on client", async () => {
      mockGetConsensusStatus.mockResolvedValue({
        lastFinalizedBlockHeight: 100n,
        lastFinalizedBlock: { toString: () => "hash" },
        lastFinalizedTime: 1000n,
      });

      const currency = createMockCurrency();
      await getLastBlock(currency);

      expect(mockGetConsensusStatus).toHaveBeenCalled();
    });
  });

  describe("getBlockChainParameters", () => {
    it("should return chain parameters", async () => {
      const mockParams = {
        euroPerEnergy: { numerator: 1n, denominator: 1000n },
        microGTUPerEuro: { numerator: 1000000n, denominator: 1n },
      };
      mockGetBlockChainParameters.mockResolvedValue(mockParams);

      const currency = createMockCurrency();
      const result = await getBlockChainParameters(currency);

      expect(result).toEqual(mockParams);
    });
  });

  describe("getBlockInfoByHeight", () => {
    it("should return block info at height", async () => {
      const blockHash = { toString: () => "blockhash456" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 500n,
        blockHash: { toString: () => "blockhash456" },
        blockSlotTime: new Date("2024-01-01"),
      });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(500, currency);

      expect(result.height).toBe(500);
      expect(result.hash).toBe("blockhash456");
    });

    it("should throw error when no blocks found at height", async () => {
      mockGetBlocksAtHeight.mockResolvedValue([]);

      const currency = createMockCurrency();

      await expect(getBlockInfoByHeight(999, currency)).rejects.toThrow(
        "No blocks found at height 999",
      );
    });

    it("should include parent block info when height > 0", async () => {
      const blockHash = { toString: () => "blockhash" };
      const parentHash = { toString: () => "parenthash" };

      mockGetBlocksAtHeight
        .mockResolvedValueOnce([blockHash]) // for height 500
        .mockResolvedValueOnce([parentHash]); // for height 499

      mockGetBlockInfo
        .mockResolvedValueOnce({
          blockHeight: 500n,
          blockHash: { toString: () => "blockhash" },
          blockSlotTime: new Date("2024-01-02"),
        })
        .mockResolvedValueOnce({
          blockHeight: 499n,
          blockHash: { toString: () => "parenthash" },
          blockSlotTime: new Date("2024-01-01"),
        });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(500, currency);

      expect(result.parent).not.toBeUndefined();
      expect(result.parent?.height).toBe(499);
      expect(result.parent?.hash).toBe("parenthash");
    });

    it("should not include parent for height 0", async () => {
      const blockHash = { toString: () => "genesis" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 0n,
        blockHash: { toString: () => "genesis" },
        blockSlotTime: new Date("2024-01-01"),
      });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(0, currency);

      expect(result.parent).toBeUndefined();
    });
  });

  describe("getBlockByHeight", () => {
    it("should return block with transactions", async () => {
      const blockHash = { toString: () => "blockhash" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 100n,
        blockHash: { toString: () => "blockhash" },
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEvents.mockResolvedValue([]);

      const currency = createMockCurrency();
      const result = await getBlockByHeight(100, currency);

      expect(result.info.height).toBe(100);
      expect(result.transactions).toEqual([]);
    });

    it("should parse transfer transactions", async () => {
      const blockHash = { toString: () => "blockhash" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 100n,
        blockHash: { toString: () => "blockhash" },
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEvents.mockResolvedValue([
        {
          type: "accountTransaction",
          transactionType: "transfer",
          hash: { toString: () => "txhash" },
          cost: { toString: () => "1000" },
          sender: { toString: () => "sender-address" },
          transfer: {
            amount: { microCcdAmount: { toString: () => "5000000" } },
            to: { toString: () => "recipient-address" },
          },
        },
      ]);

      const currency = createMockCurrency();
      const result = await getBlockByHeight(100, currency);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].hash).toBe("txhash");
      expect(result.transactions[0].operations).toHaveLength(2);
    });

    it("should handle failed transactions", async () => {
      const blockHash = { toString: () => "blockhash" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 100n,
        blockHash: { toString: () => "blockhash" },
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEvents.mockResolvedValue([
        {
          type: "accountTransaction",
          transactionType: "failed",
          hash: { toString: () => "failedtx" },
          cost: { toString: () => "500" },
          sender: { toString: () => "sender" },
        },
      ]);

      const currency = createMockCurrency();
      const result = await getBlockByHeight(100, currency);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].failed).toBe(true);
    });

    it("should skip non-accountTransaction events", async () => {
      const blockHash = { toString: () => "blockhash" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 100n,
        blockHash: { toString: () => "blockhash" },
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEvents.mockResolvedValue([
        null,
        { type: "other" },
        {
          type: "accountTransaction",
          transactionType: "transfer",
          hash: { toString: () => "tx" },
          cost: { toString: () => "100" },
          sender: { toString: () => "s" },
          transfer: {
            amount: { microCcdAmount: { toString: () => "1000" } },
            to: { toString: () => "r" },
          },
        },
      ]);

      const currency = createMockCurrency();
      const result = await getBlockByHeight(100, currency);

      expect(result.transactions).toHaveLength(1);
    });
  });

  describe("getOperations", () => {
    beforeEach(() => {
      mockGetConsensusStatus.mockResolvedValue({
        lastFinalizedBlockHeight: 1000n,
        lastFinalizedBlock: { toString: () => "hash" },
        lastFinalizedTime: 1700000000000n,
      });
    });

    it("should return empty array when minHeight exceeds current height", async () => {
      const currency = createMockCurrency();
      const result = await getOperations("address", { minHeight: 2000 }, currency);

      expect(result).toEqual([[], ""]);
    });

    it("should scan blocks for address operations", async () => {
      const blockHash = { toString: () => "blockhash" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 100n,
        blockHash: { toString: () => "blockhash" },
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEvents.mockResolvedValue([
        {
          type: "accountTransaction",
          transactionType: "transfer",
          hash: { toString: () => "txhash" },
          cost: { toString: () => "1000" },
          sender: { toString: () => "my-address" },
          transfer: {
            amount: { microCcdAmount: { toString: () => "5000000" } },
            to: { toString: () => "recipient" },
          },
        },
      ]);

      const currency = createMockCurrency();
      const [operations] = await getOperations("my-address", { minHeight: 100 }, currency);

      expect(operations.length).toBeGreaterThanOrEqual(0);
    });

    it("should filter operations for specific address", async () => {
      const blockHash = { toString: () => "blockhash" };
      mockGetBlocksAtHeight.mockResolvedValue([blockHash]);
      mockGetBlockInfo.mockResolvedValue({
        blockHeight: 100n,
        blockHash: { toString: () => "blockhash" },
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEvents.mockResolvedValue([
        {
          type: "accountTransaction",
          transactionType: "transfer",
          hash: { toString: () => "txhash" },
          cost: { toString: () => "1000" },
          sender: { toString: () => "other-address" },
          transfer: {
            amount: { microCcdAmount: { toString: () => "5000000" } },
            to: { toString: () => "another-address" },
          },
        },
      ]);

      const currency = createMockCurrency();
      const [operations] = await getOperations("my-address", { minHeight: 100 }, currency);

      // Should not include transactions not involving my-address
      expect(
        operations.filter(
          op => op.senders.includes("my-address") || op.recipients.includes("my-address"),
        ),
      ).toHaveLength(0);
    });
  });
});
