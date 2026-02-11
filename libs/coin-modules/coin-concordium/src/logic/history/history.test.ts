import { VALID_ADDRESS } from "../../test/fixtures";
import { createTestCryptoCurrency } from "../../test/testHelpers";
import { lastBlock } from "./lastBlock";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";
import { listOperations } from "./listOperations";

jest.mock("../../network/grpcClient", () => ({
  getLastBlock: jest.fn(),
  getBlockByHeight: jest.fn(),
  getBlockInfoByHeight: jest.fn(),
  getOperations: jest.fn(),
}));

jest.mock("../../network/proxyClient", () => ({
  getOperations: jest.fn(),
}));

const {
  getLastBlock: getLastBlockMock,
  getBlockByHeight: getBlockByHeightMock,
  getBlockInfoByHeight: getBlockInfoByHeightMock,
  getOperations: getOperationsGrpcMock,
} = jest.requireMock("../../network/grpcClient");

const { getOperations: getOperationsProxyMock } = jest.requireMock("../../network/proxyClient");

const mockCurrency = createTestCryptoCurrency({
  id: "concordium",
  name: "Concordium",
});

describe("history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("lastBlock", () => {
    it("should return block info from grpc client", async () => {
      // GIVEN
      const mockTimestamp = "2024-01-15T10:30:00Z";
      getLastBlockMock.mockResolvedValue({
        height: 12345,
        hash: "abc123hash",
        time: new Date(mockTimestamp),
      });

      // WHEN
      const result = await lastBlock(mockCurrency);

      // THEN
      expect(getLastBlockMock).toHaveBeenCalledWith(mockCurrency);
      expect(result).toEqual({
        height: 12345,
        hash: "abc123hash",
        time: new Date(mockTimestamp),
      });
    });
  });

  describe("getBlock", () => {
    it("should return block from grpc client by height", async () => {
      // GIVEN
      const mockBlock = {
        height: 1000,
        hash: "blockhash1000",
        time: new Date("2024-01-10"),
        transactions: [],
      };
      getBlockByHeightMock.mockResolvedValue(mockBlock);

      // WHEN
      const result = await getBlock(1000, mockCurrency);

      // THEN
      expect(getBlockByHeightMock).toHaveBeenCalledWith(mockCurrency, 1000);
      expect(result).toEqual(mockBlock);
    });
  });

  describe("getBlockInfo", () => {
    it("should return block info from grpc client by height", async () => {
      // GIVEN
      const mockBlockInfo = {
        height: 2000,
        hash: "blockhash2000",
        time: new Date("2024-01-12"),
      };
      getBlockInfoByHeightMock.mockResolvedValue(mockBlockInfo);

      // WHEN
      const result = await getBlockInfo(2000, mockCurrency);

      // THEN
      expect(getBlockInfoByHeightMock).toHaveBeenCalledWith(mockCurrency, 2000);
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("listOperations", () => {
    it("should use grpc client when minHeight > 0", async () => {
      // GIVEN
      const mockOperations = [
        {
          id: "op1",
          asset: { type: "native" },
          tx: { hash: "tx1", fees: BigInt(100), date: new Date(), failed: false, block: {} },
          type: "OUT",
          value: BigInt(1000),
          senders: [VALID_ADDRESS],
          recipients: ["recipient1"],
        },
      ];
      getOperationsGrpcMock.mockResolvedValue([mockOperations, ""]);

      // WHEN
      const result = await listOperations(VALID_ADDRESS, { minHeight: 100 }, mockCurrency);

      // THEN
      expect(getOperationsGrpcMock).toHaveBeenCalledWith(mockCurrency, VALID_ADDRESS, {
        minHeight: 100,
      });
      expect(result).toEqual([mockOperations, ""]);
    });

    it("should use proxy client when minHeight is 0", async () => {
      // GIVEN
      const mockLiveOperations = [
        {
          id: "encoded-op-id-1",
          hash: "txhash1",
          fee: 500,
          date: new Date("2024-01-15"),
          blockHeight: 3000,
          blockHash: "block3000",
          type: "OUT",
          value: 50000,
          senders: [VALID_ADDRESS],
          recipients: ["recipient2"],
        },
      ];
      getOperationsProxyMock.mockResolvedValue(mockLiveOperations);

      // WHEN
      const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, mockCurrency);

      // THEN
      expect(getOperationsProxyMock).toHaveBeenCalledWith(
        mockCurrency,
        VALID_ADDRESS,
        expect.stringContaining("concordium"),
      );
      expect(result[0]).toHaveLength(1);
      expect(result[0][0]).toMatchObject({
        id: "encoded-op-id-1",
        type: "OUT",
      });
      expect(result[1]).toBe("");
    });

    it("should transform proxy operations to API format", async () => {
      // GIVEN
      const opDate = new Date("2024-01-15T12:00:00Z");
      const mockLiveOperations = [
        {
          id: "encoded-op-id-2",
          hash: "txhash2",
          fee: 1000,
          date: opDate,
          blockHeight: 4000,
          blockHash: "block4000",
          type: "IN",
          value: 100000,
          senders: ["sender1"],
          recipients: [VALID_ADDRESS],
        },
      ];
      getOperationsProxyMock.mockResolvedValue(mockLiveOperations);

      // WHEN
      const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, mockCurrency);

      // THEN
      const [operations] = result;
      expect(operations[0]).toEqual({
        id: "encoded-op-id-2",
        asset: { type: "native" },
        tx: {
          hash: "txhash2",
          fees: BigInt(1000),
          date: opDate,
          failed: false,
          block: {
            height: 4000,
            hash: "block4000",
            time: opDate,
          },
        },
        type: "IN",
        value: BigInt(100000),
        senders: ["sender1"],
        recipients: [VALID_ADDRESS],
      });
    });

    it("should handle missing blockHeight and blockHash", async () => {
      // GIVEN
      const opDate = new Date("2024-01-15T12:00:00Z");
      const mockLiveOperations = [
        {
          id: "encoded-op-id-3",
          hash: "txhash3",
          fee: 500,
          date: opDate,
          blockHeight: undefined,
          blockHash: undefined,
          type: "OUT",
          value: 25000,
          senders: [VALID_ADDRESS],
          recipients: ["recipient3"],
        },
      ];
      getOperationsProxyMock.mockResolvedValue(mockLiveOperations);

      // WHEN
      const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, mockCurrency);

      // THEN
      const [operations] = result;
      expect(operations[0].tx.block).toEqual({
        height: 0,
        hash: "txhash3", // Falls back to tx hash
        time: opDate,
      });
    });

    it("should return empty array when no operations found", async () => {
      // GIVEN
      getOperationsProxyMock.mockResolvedValue([]);

      // WHEN
      const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, mockCurrency);

      // THEN
      expect(result).toEqual([[], ""]);
    });
  });
});
