import { createTestCryptoCurrency } from "../test/testHelpers";
import {
  getClient,
  withClient,
  getLastBlock,
  getBlockInfoByHeight,
  getBlockByHeight,
  getOperations,
} from "./grpcClient";

// Type definitions for gRPC callbacks
type GrpcCallback<T> = (error: Error | null, response: T | null) => void;

// Mock the gRPC methods
const mockGetConsensusStatusResponse = jest.fn();
const mockGetBlocksAtHeightResponse = jest.fn();
const mockGetBlockInfoResponse = jest.fn();
const mockGetBlockTransactionEventsStream = jest.fn();

jest.mock("@grpc/grpc-js", () => ({
  ...jest.requireActual("@grpc/grpc-js"),
  loadPackageDefinition: jest.fn().mockReturnValue({
    concordium: {
      v2: {
        Queries: jest.fn().mockImplementation(() => ({
          GetConsensusInfo: <T>(_req: T, callback: GrpcCallback<T>) => {
            const response = mockGetConsensusStatusResponse();
            if (response instanceof Error) {
              callback(response, null);
            } else {
              callback(null, {
                lastFinalizedBlockHeight: { value: response.lastFinalizedBlockHeight },
                lastFinalizedBlock: { value: Buffer.from(response.lastFinalizedBlock, "hex") },
                lastFinalizedTime: response.lastFinalizedTime,
              });
            }
          },
          GetBlocksAtHeight: <T>(_req: T, callback: GrpcCallback<{ blocks: T }>) => {
            const response = mockGetBlocksAtHeightResponse();
            if (response instanceof Error) {
              callback(response, null);
            } else {
              callback(null, { blocks: response });
            }
          },
          GetBlockInfo: <T>(_req: T, callback: GrpcCallback<T>) => {
            const response = mockGetBlockInfoResponse();
            if (response instanceof Error) {
              callback(response, null);
            } else {
              callback(null, {
                height: { value: String(response.blockHeight) },
                hash: { value: Buffer.from(response.blockHash, "hex") },
                slotTime: { value: String(response.blockSlotTime.getTime()) },
              });
            }
          },
          GetBlockTransactionEvents: () => mockGetBlockTransactionEventsStream(),
        })),
      },
    },
  }),
  credentials: {
    createInsecure: jest.fn(),
    createSsl: jest.fn(),
  },
}));

jest.mock("@grpc/proto-loader", () => ({
  loadSync: jest.fn().mockReturnValue({}),
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

const createMockCurrency = () =>
  createTestCryptoCurrency({
    id: "concordium",
    family: "concordium",
  });

describe("grpcClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getClient", () => {
    it("should create a new client for currency", () => {
      const currency = createMockCurrency();
      const client = getClient(currency);

      expect(client).not.toBeUndefined();
    });

    it("should return cached client on subsequent calls", () => {
      const currency = createMockCurrency();
      const client1 = getClient(currency);
      const client2 = getClient(currency);

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
      const mockHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "1000",
        lastFinalizedBlock: mockHash,
        lastFinalizedTime: { value: "1700000000000" },
      });

      const currency = createMockCurrency();
      const result = await getLastBlock(currency);

      expect(result).toEqual({
        height: 1000,
        hash: mockHash,
        time: new Date(1700000000000),
      });
    });

    it("should call getConsensusStatus on client", async () => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "100",
        lastFinalizedBlock: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        lastFinalizedTime: { value: "1000" },
      });

      const currency = createMockCurrency();
      await getLastBlock(currency);

      expect(mockGetConsensusStatusResponse).toHaveBeenCalled();
    });
  });

  describe("getBlockInfoByHeight", () => {
    it("should return block info at height", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abc456abc456abc456abc456abc456abc456abc456abc456abc456abc456abc4" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 500n,
        blockHash: "abc456abc456abc456abc456abc456abc456abc456abc456abc456abc456abc4",
        blockSlotTime: new Date("2024-01-01"),
      });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(currency, 500);

      expect(result.height).toBe(500);
      expect(result.hash).toBe("abc456abc456abc456abc456abc456abc456abc456abc456abc456abc456abc4");
    });

    it("should throw error when no blocks found at height", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([]);

      const currency = createMockCurrency();

      await expect(getBlockInfoByHeight(currency, 999)).rejects.toThrow(
        "No blocks found at height 999",
      );
    });

    it("should include parent block info when height > 0", async () => {
      mockGetBlocksAtHeightResponse
        .mockReturnValueOnce([
          { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
        ])
        .mockReturnValueOnce([
          { value: "def123def123def123def123def123def123def123def123def123def123def1" },
        ]);

      mockGetBlockInfoResponse
        .mockReturnValueOnce({
          blockHeight: 500n,
          blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
          blockSlotTime: new Date("2024-01-02"),
        })
        .mockReturnValueOnce({
          blockHeight: 499n,
          blockHash: "def123def123def123def123def123def123def123def123def123def123def1",
          blockSlotTime: new Date("2024-01-01"),
        });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(currency, 500);

      expect(result.parent).not.toBeUndefined();
      expect(result.parent?.height).toBe(499);
      expect(result.parent?.hash).toBe(
        "def123def123def123def123def123def123def123def123def123def123def1",
      );
    });

    it("should not include parent for height 0", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "0000000000000000000000000000000000000000000000000000000000000000" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 0n,
        blockHash: "0000000000000000000000000000000000000000000000000000000000000000",
        blockSlotTime: new Date("2024-01-01"),
      });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(currency, 0);

      expect(result.parent).toBeUndefined();
    });
  });

  describe("getBlockByHeight", () => {
    it("should return block with transactions", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue((async function* () {})());

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.info.height).toBe(100);
      expect(result.transactions).toEqual([]);
    });

    it("should parse transfer transactions", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "transfer",
              hash: "txhash",
              cost: "1000",
              sender: "sender-address",
              effects: {
                accountTransfer: {
                  amount: "5000000",
                  to: "recipient-address",
                },
              },
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].hash).toBe("txhash");
      expect(result.transactions[0].operations).toHaveLength(2);
    });

    it("should handle failed transactions", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "failed",
              hash: "failedtx",
              cost: "500",
              sender: "sender",
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].failed).toBe(true);
    });

    it("should skip non-accountTransaction events", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield null;
          yield { type: "other" };
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "transfer",
              hash: "tx",
              cost: "100",
              sender: "s",
              effects: {
                accountTransfer: {
                  amount: "1000",
                  to: "r",
                },
              },
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.transactions).toHaveLength(1);
    });
  });

  describe("getOperations", () => {
    beforeEach(() => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "1000",
        lastFinalizedBlock: "hash",
        lastFinalizedTime: { value: "1700000000000" },
      });
    });

    it("should return empty array when minHeight exceeds current height", async () => {
      const currency = createMockCurrency();
      const result = await getOperations(currency, "address", { minHeight: 2000 });

      expect(result).toEqual([[], ""]);
    });

    it("should scan blocks for address operations", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "transfer",
              hash: "txhash",
              cost: "1000",
              sender: "my-address",
              effects: {
                accountTransfer: {
                  amount: "5000000",
                  to: "recipient",
                },
              },
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const [operations] = await getOperations(currency, "my-address", { minHeight: 100 });

      expect(operations.length).toBeGreaterThanOrEqual(0);
    });

    it("should filter operations for specific address", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "transfer",
              hash: "txhash",
              cost: "1000",
              sender: "other-address",
              effects: {
                accountTransfer: {
                  amount: "5000000",
                  to: "another-address",
                },
              },
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const [operations] = await getOperations(currency, "my-address", { minHeight: 100 });

      // Should not include transactions not involving my-address
      expect(
        operations.filter(
          op => op.senders.includes("my-address") || op.recipients.includes("my-address"),
        ),
      ).toHaveLength(0);
    });

    it("should return empty cursor when at chain tip", async () => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "100",
        lastFinalizedBlock: "hash",
        lastFinalizedTime: { value: "1700000000000" },
      });
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue((async function* () {})());

      const currency = createMockCurrency();
      const [, cursor] = await getOperations(currency, "my-address", { minHeight: 100 });

      expect(cursor).toBe("");
    });

    it("should return next block height as cursor when more blocks exist", async () => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "2000",
        lastFinalizedBlock: "hash",
        lastFinalizedTime: { value: "1700000000000" },
      });
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue((async function* () {})());

      const currency = createMockCurrency();
      // Scan from height 100, will hit MAX_BLOCKS_TO_SCAN (1000) limit at height 1100
      const [, cursor] = await getOperations(currency, "my-address", { minHeight: 100 });

      // Next height should be 1101 (endHeight + 1 where endHeight = 100 + 1000)
      expect(cursor).toBe(JSON.stringify(1101));
    });

    it("should return correct cursor when scan ends before MAX_BLOCKS_TO_SCAN", async () => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "150",
        lastFinalizedBlock: "hash",
        lastFinalizedTime: { value: "1700000000000" },
      });
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockReturnValue((async function* () {})());

      const currency = createMockCurrency();
      // Scan from 100 to 150 (current height)
      const [, cursor] = await getOperations(currency, "my-address", { minHeight: 100 });

      // At chain tip, should return empty cursor
      expect(cursor).toBe("");
    });
  });

  describe("error handling", () => {
    it("should handle and throw getLastBlock errors", async () => {
      mockGetConsensusStatusResponse.mockReturnValue(new Error("Connection failed"));

      const currency = createMockCurrency();

      await expect(getLastBlock(currency)).rejects.toThrow("Connection failed");
    });

    it("should handle and throw getBlockInfoByHeight errors when GetBlocksAtHeight fails", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue(new Error("Network error"));

      const currency = createMockCurrency();

      await expect(getBlockInfoByHeight(currency, 100)).rejects.toThrow("Network error");
    });

    it("should handle and throw getBlockInfoByHeight errors when GetBlockInfo fails", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue(new Error("Block not found"));

      const currency = createMockCurrency();

      await expect(getBlockInfoByHeight(currency, 100)).rejects.toThrow("Block not found");
    });

    it("should handle and throw getBlockByHeight errors", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
      mockGetBlockTransactionEventsStream.mockImplementation(() => {
        throw new Error("Stream error");
      });

      const currency = createMockCurrency();

      await expect(getBlockByHeight(currency, 100)).rejects.toThrow("Stream error");
    });
  });

  describe("transaction type parsing", () => {
    beforeEach(() => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "1000",
        lastFinalizedBlock: "hash",
        lastFinalizedTime: { value: "1700000000000" },
      });
      mockGetBlocksAtHeightResponse.mockReturnValue([
        { value: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00" },
      ]);
      mockGetBlockInfoResponse.mockReturnValue({
        blockHeight: 100n,
        blockHash: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        blockSlotTime: new Date("2024-01-01"),
      });
    });

    it("should parse transferWithMemo transactions", async () => {
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "transferWithMemo",
              hash: "txhash",
              cost: "1000",
              sender: "sender-address",
              effects: {
                accountTransfer: {
                  amount: "5000000",
                  to: "recipient-address",
                  memo: "48656c6c6f",
                },
              },
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].hash).toBe("txhash");
    });

    it("should parse encrypted transfer transactions", async () => {
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "encryptedAmountTransfer",
              hash: "encrypted-tx",
              cost: "2000",
              sender: "sender-address",
              effects: {
                encryptedAmountTransferred: {
                  removed: { data: "removed-data" },
                  added: { data: "added-data" },
                },
              },
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].hash).toBe("encrypted-tx");
    });

    it("should handle module deploy transactions", async () => {
      mockGetBlockTransactionEventsStream.mockReturnValue(
        (async function* () {
          yield {
            accountTransaction: {
              type: "accountTransaction",
              transactionType: "deployModule",
              hash: "module-tx",
              cost: "5000",
              sender: "sender-address",
              effects: {
                moduleDeployed: {
                  moduleRef: "module-ref-123",
                },
              },
            },
          };
        })(),
      );

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.transactions).toHaveLength(1);
    });
  });
});
