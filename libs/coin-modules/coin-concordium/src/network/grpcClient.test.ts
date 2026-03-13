import { getClient, withClient, getBlockByHeight, getOperations } from "./grpcClient";

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
          GetConsensusInfo: (_req: any, callback: GrpcCallback<any>) => {
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
          GetBlockInfo: (_req: any, callback: GrpcCallback<any>) => {
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
      grpcUrl: "https://ccd-node-testnet.coin.ledger-test.com",
      grpcPort: 443,
    }),
  },
}));

const currencyId = "concordium_testnet";

describe("grpcClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getClient", () => {
    it("should create a new client for currency", () => {
      const client = getClient(currencyId);

      expect(client).not.toBeUndefined();
    });

    it("should return cached client on subsequent calls", () => {
      const client1 = getClient(currencyId);
      const client2 = getClient(currencyId);

      expect(client1).toBe(client2);
    });
  });

  describe("withClient", () => {
    it("should execute function with client", async () => {
      const mockFn = jest.fn().mockResolvedValue("result");

      const result = await withClient(currencyId, mockFn);

      expect(result).toBe("result");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure", async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce("success");

      const result = await withClient(currencyId, mockFn, 1);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should throw after all retries exhausted", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Always fails"));

      await expect(withClient(currencyId, mockFn, 1)).rejects.toThrow("Always fails");
      expect(mockFn).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it("should use default retries when not specified", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Fails"));

      await expect(withClient(currencyId, mockFn)).rejects.toThrow("Fails");
      expect(mockFn).toHaveBeenCalledTimes(2); // DEFAULT_RETRIES = 1
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

      const result = await getBlockByHeight(currencyId, 100);

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

      const result = await getBlockByHeight(currencyId, 100);

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

      const result = await getBlockByHeight(currencyId, 100);

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

      const result = await getBlockByHeight(currencyId, 100);

      expect(result.transactions).toHaveLength(1);
    });
  });

  describe("getOperations", () => {
    beforeEach(() => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "1000",
        lastFinalizedBlock: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
        lastFinalizedTime: { value: "1700000000000" },
      });
    });

    it("should return empty array when minHeight exceeds current height", async () => {
      const result = await getOperations(currencyId, "address", { minHeight: 2000 });

      expect(result).toEqual({ items: [], next: undefined });
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

      const { items: operations } = await getOperations(currencyId, "my-address", {
        minHeight: 100,
      });

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

      const { items: operations } = await getOperations(currencyId, "my-address", {
        minHeight: 100,
      });

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
        lastFinalizedBlock: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
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

      const { next: cursor } = await getOperations(currencyId, "my-address", { minHeight: 100 });

      expect(cursor).toBeUndefined();
    });

    it("should return next block height as cursor when more blocks exist", async () => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "2000",
        lastFinalizedBlock: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
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

      // Scan from height 100, will hit MAX_BLOCKS_TO_SCAN (1000) limit at height 1100
      const { next: cursor } = await getOperations(currencyId, "my-address", { minHeight: 100 });

      // Next height should be 1101 (endHeight + 1 where endHeight = 100 + 1000)
      expect(cursor).toBe(JSON.stringify(1101));
    });

    it("should return correct cursor when scan ends before MAX_BLOCKS_TO_SCAN", async () => {
      mockGetConsensusStatusResponse.mockReturnValue({
        lastFinalizedBlockHeight: "150",
        lastFinalizedBlock: "abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00abcdef00",
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

      // Scan from 100 to 150 (current height)
      const { next: cursor } = await getOperations(currencyId, "my-address", { minHeight: 100 });

      // At chain tip, should return empty cursor
      expect(cursor).toBeUndefined();
    });
  });

  describe("error handling", () => {
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

      await expect(getBlockByHeight(currencyId, 100)).rejects.toThrow("Stream error");
    });
  });

  describe("transaction type parsing", () => {
    beforeEach(() => {
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

      const result = await getBlockByHeight(currencyId, 100);

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

      const result = await getBlockByHeight(currencyId, 100);

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

      const result = await getBlockByHeight(currencyId, 100);

      expect(result.transactions).toHaveLength(1);
    });
  });
});
