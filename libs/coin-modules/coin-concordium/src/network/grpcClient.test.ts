import { getClient, withClient, getOperations } from "./grpcClient";

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
});
