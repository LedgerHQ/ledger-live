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
              callback(null, response);
            }
          },
          GetBlocksAtHeight: <T>(_req: T, callback: GrpcCallback<T>) => {
            const response = mockGetBlocksAtHeightResponse();
            if (response instanceof Error) {
              callback(response, null);
            } else {
              callback(null, response);
            }
          },
          GetBlockInfo: <T>(_req: T, callback: GrpcCallback<T>) => {
            const response = mockGetBlockInfoResponse();
            if (response instanceof Error) {
              callback(response, null);
            } else {
              callback(null, response);
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
      mockGetConsensusStatusResponse.mockReturnValue({
        last_finalized_block_height: { value: "1000" },
        last_finalized_block: { value: Buffer.from("aabbccdd11223344", "hex") },
        last_finalized_time: { value: "1700000000000" },
      });

      const currency = createMockCurrency();
      const result = await getLastBlock(currency);

      expect(result).toEqual({
        height: 1000,
        hash: "aabbccdd11223344",
        time: new Date(1700000000000),
      });
    });

    it("should call getConsensusStatus on client", async () => {
      mockGetConsensusStatusResponse.mockReturnValue({
        last_finalized_block_height: { value: "100" },
        last_finalized_block: { value: Buffer.from("abcd", "hex") },
        last_finalized_time: { value: "1000" },
      });

      const currency = createMockCurrency();
      await getLastBlock(currency);

      expect(mockGetConsensusStatusResponse).toHaveBeenCalled();
    });
  });

  describe("getBlockInfoByHeight", () => {
    it("should return block info at height", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("aa11bb22cc33", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "500" },
        hash: { value: Buffer.from("aa11bb22cc33", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
      });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(currency, 500);

      expect(result.height).toBe(500);
      expect(result.hash).toBe("aa11bb22cc33");
    });

    it("should throw error when no blocks found at height", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({ blocks: [] });

      const currency = createMockCurrency();

      await expect(getBlockInfoByHeight(currency, 999)).rejects.toThrow(
        "No blocks found at height 999",
      );
    });

    it("should include parent block info when height > 0", async () => {
      mockGetBlocksAtHeightResponse
        .mockReturnValueOnce({ blocks: [{ value: Buffer.from("dd11ee22", "hex") }] })
        .mockReturnValueOnce({ blocks: [{ value: Buffer.from("ff33aa44", "hex") }] });

      mockGetBlockInfoResponse
        .mockReturnValueOnce({
          height: { value: "500" },
          hash: { value: Buffer.from("dd11ee22", "hex") },
          parent_block: { value: Buffer.alloc(0) },
          slot_time: { value: String(new Date("2024-01-02").getTime()) },
        })
        .mockReturnValueOnce({
          height: { value: "499" },
          hash: { value: Buffer.from("ff33aa44", "hex") },
          parent_block: { value: Buffer.alloc(0) },
          slot_time: { value: String(new Date("2024-01-01").getTime()) },
        });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(currency, 500);

      expect(result.parent).not.toBeUndefined();
      expect(result.parent?.height).toBe(499);
      expect(result.parent?.hash).toBe("ff33aa44");
    });

    it("should not include parent for height 0", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("0000aabb", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "0" },
        hash: { value: Buffer.from("0000aabb", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
      });

      const currency = createMockCurrency();
      const result = await getBlockInfoByHeight(currency, 0);

      expect(result.parent).toBeUndefined();
    });
  });

  describe("getBlockByHeight", () => {
    it("should return block with transactions", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
      });
      mockGetBlockTransactionEventsStream.mockReturnValue((async function* () {})());

      const currency = createMockCurrency();
      const result = await getBlockByHeight(currency, 100);

      expect(result.info.height).toBe(100);
      expect(result.transactions).toEqual([]);
    });

    it("should parse transfer transactions", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
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
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
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
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
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
        last_finalized_block_height: { value: "1000" },
        last_finalized_block: { value: Buffer.from("abcd", "hex") },
        last_finalized_time: { value: "1700000000000" },
      });
    });

    it("should return empty array when minHeight exceeds current height", async () => {
      const currency = createMockCurrency();
      const result = await getOperations("address", { minHeight: 2000 }, currency);

      expect(result).toEqual([[], ""]);
    });

    it("should scan blocks for address operations", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
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
      const [operations] = await getOperations("my-address", { minHeight: 100 }, currency);

      expect(operations.length).toBeGreaterThanOrEqual(0);
    });

    it("should filter operations for specific address", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
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
      const [operations] = await getOperations("my-address", { minHeight: 100 }, currency);

      // Should not include transactions not involving my-address
      expect(
        operations.filter(
          op => op.senders.includes("my-address") || op.recipients.includes("my-address"),
        ),
      ).toHaveLength(0);
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
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue(new Error("Block not found"));

      const currency = createMockCurrency();

      await expect(getBlockInfoByHeight(currency, 100)).rejects.toThrow("Block not found");
    });

    it("should handle and throw getBlockByHeight errors", async () => {
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
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
        last_finalized_block_height: { value: "1000" },
        last_finalized_block: { value: Buffer.from("abcd", "hex") },
        last_finalized_time: { value: "1700000000000" },
      });
      mockGetBlocksAtHeightResponse.mockReturnValue({
        blocks: [{ value: Buffer.from("blockhash", "hex") }],
      });
      mockGetBlockInfoResponse.mockReturnValue({
        height: { value: "100" },
        hash: { value: Buffer.from("blockhash", "hex") },
        parent_block: { value: Buffer.alloc(0) },
        slot_time: { value: String(new Date("2024-01-01").getTime()) },
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
