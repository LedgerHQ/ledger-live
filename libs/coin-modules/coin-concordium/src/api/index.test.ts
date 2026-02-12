import type { ConcordiumCoinConfig } from "../types";
import { VALID_ADDRESS } from "../test/fixtures";
import { createApi } from ".";

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  craftRawTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  getBlock: jest.fn(),
  getBlockInfo: jest.fn(),
  getNextValidSequence: jest.fn(),
  lastBlock: jest.fn(),
  listOperations: jest.fn(),
}));

const {
  broadcast: broadcastMock,
  getBalance: getBalanceMock,
  getBlock: getBlockMock,
  getBlockInfo: getBlockInfoMock,
  lastBlock: lastBlockMock,
  listOperations: listOperationsMock,
} = jest.requireMock("../logic");

const mockConfig: ConcordiumCoinConfig = {
  networkType: "testnet",
  grpcUrl: "https://grpc.testnet.concordium.com",
  grpcPort: 20000,
  proxyUrl: "https://wallet-proxy.testnet.concordium.com",
  minReserve: 0,
};

describe("api/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return every api methods", () => {
    expect(createApi(mockConfig)).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
    });
  });

  describe("broadcast", () => {
    it("should call broadcast with transaction and currency", async () => {
      const api = createApi(mockConfig);
      broadcastMock.mockResolvedValue("tx-hash-123");

      const result = await api.broadcast("signed-tx-data");

      expect(broadcastMock).toHaveBeenCalledWith(
        "signed-tx-data",
        expect.objectContaining({ id: "concordium" }),
      );
      expect(result).toBe("tx-hash-123");
    });
  });

  describe("getBalance", () => {
    it("should call getBalance with address and currency", async () => {
      const api = createApi(mockConfig);
      getBalanceMock.mockResolvedValue(BigInt(5000000));

      const result = await api.getBalance(VALID_ADDRESS);

      expect(getBalanceMock).toHaveBeenCalledWith(
        VALID_ADDRESS,
        expect.objectContaining({ id: "concordium" }),
      );
      expect(result).toBe(BigInt(5000000));
    });
  });

  describe("lastBlock", () => {
    it("should call lastBlock with currency", async () => {
      const api = createApi(mockConfig);
      const mockBlockInfo = { height: 1000, hash: "block-hash", time: new Date() };
      lastBlockMock.mockResolvedValue(mockBlockInfo);

      const result = await api.lastBlock();

      expect(lastBlockMock).toHaveBeenCalledWith(expect.objectContaining({ id: "concordium" }));
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("listOperations", () => {
    it("should call listOperations with address, pagination and currency", async () => {
      const api = createApi(mockConfig);
      const mockOperations = [{ id: "op1" }, { id: "op2" }];
      const mockCursor = "";
      listOperationsMock.mockResolvedValue([mockOperations, mockCursor]);
      const pagination = { minHeight: 100 };

      const result = await api.listOperations(VALID_ADDRESS, pagination);

      expect(listOperationsMock).toHaveBeenCalledWith(
        VALID_ADDRESS,
        pagination,
        expect.objectContaining({ id: "concordium" }),
      );
      expect(result).toEqual([mockOperations, mockCursor]);
    });
  });

  describe("getBlock", () => {
    it("should call getBlock with height and currency", async () => {
      const api = createApi(mockConfig);
      const mockBlock = { height: 500, hash: "block-500", transactions: [] };
      getBlockMock.mockResolvedValue(mockBlock);

      const result = await api.getBlock(500);

      expect(getBlockMock).toHaveBeenCalledWith(500, expect.objectContaining({ id: "concordium" }));
      expect(result).toEqual(mockBlock);
    });
  });

  describe("getBlockInfo", () => {
    it("should call getBlockInfo with height and currency", async () => {
      const api = createApi(mockConfig);
      const mockBlockInfo = { height: 600, hash: "block-600", time: new Date() };
      getBlockInfoMock.mockResolvedValue(mockBlockInfo);

      const result = await api.getBlockInfo(600);

      expect(getBlockInfoMock).toHaveBeenCalledWith(
        600,
        expect.objectContaining({ id: "concordium" }),
      );
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("unsupported methods", () => {
    it("should throw error for getStakes", () => {
      const api = createApi(mockConfig);
      expect(() => api.getStakes("address")).toThrow("getStakes is not supported");
    });

    it("should throw error for getRewards", () => {
      const api = createApi(mockConfig);
      expect(() => api.getRewards("address")).toThrow("getRewards is not supported");
    });

    it("should throw error for getValidators", () => {
      const api = createApi(mockConfig);
      expect(() => api.getValidators()).toThrow("getValidators is not supported");
    });
  });
});
