import { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { InvalidParameterError } from "@ledgerhq/errors";
import { TESTNET_COIN_CONFIG, VALID_ADDRESS } from "../test/fixtures";
import { createApi } from ".";

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  craftRawTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  getBlockInfo: jest.fn(),
  getNextValidSequence: jest.fn(),
  lastBlock: jest.fn(),
  listOperations: jest.fn(),
}));

const {
  broadcast: broadcastMock,
  getBalance: getBalanceMock,
  getBlockInfo: getBlockInfoMock,
  lastBlock: lastBlockMock,
  listOperations: listOperationsMock,
} = jest.requireMock("../logic");

describe("api/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return every api methods", () => {
    expect(createApi(TESTNET_COIN_CONFIG, "concordium_testnet")).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getNextSequence: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      craftTransactionData: expect.any(Function),
    });
  });

  describe("broadcast", () => {
    it("should call broadcast with transaction and currency", async () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      broadcastMock.mockResolvedValue("tx-hash-123");

      const result = await api.broadcast("signed-tx-data");

      expect(broadcastMock).toHaveBeenCalledWith("signed-tx-data", "concordium_testnet");
      expect(result).toBe("tx-hash-123");
    });
  });

  describe("getBalance", () => {
    it("should call getBalance with address and currency", async () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      const mockBalances = [{ asset: { type: "native" }, value: BigInt(5000000) }];
      getBalanceMock.mockResolvedValue(mockBalances);

      const result = await api.getBalance(VALID_ADDRESS);

      expect(getBalanceMock).toHaveBeenCalledWith(VALID_ADDRESS, "concordium_testnet");
      expect(result).toEqual(mockBalances);
    });

    it("should throw an exception when options is provided", async () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      await expect(
        api.getBalance("random address", {} as unknown as BalanceOptions),
      ).rejects.toThrow(InvalidParameterError);
    });
  });

  describe("lastBlock", () => {
    it("should call lastBlock with currency", async () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      const mockBlockInfo = { height: 1000, hash: "block-hash", time: new Date() };
      lastBlockMock.mockResolvedValue(mockBlockInfo);

      const result = await api.lastBlock();

      expect(lastBlockMock).toHaveBeenCalledWith("concordium_testnet");
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("listOperations", () => {
    it("should call listOperations with address, pagination and currency", async () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      const mockRawPage = {
        items: [
          {
            hash: "aa".repeat(32),
            type: "OUT",
            sender: VALID_ADDRESS,
            recipient: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
            amount: "1000000",
            fee: "500",
            value: "1000500",
            memo: undefined,
            date: new Date("2024-06-01T00:00:00Z"),
            blockHash: "bbcc",
            blockHeight: 500,
            failed: false,
            id: 42,
          },
        ],
        next: undefined,
      };
      listOperationsMock.mockResolvedValue(mockRawPage);
      const pagination = { minHeight: 100 };

      const result = await api.listOperations(VALID_ADDRESS, pagination);

      expect(listOperationsMock).toHaveBeenCalledWith(
        VALID_ADDRESS,
        pagination,
        "concordium_testnet",
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe("OUT");
      expect(result.items[0].value).toBe(BigInt(1000500));
      expect(result.items[0].tx.fees).toBe(BigInt(500));
      expect(result.next).toBeUndefined();
    });
  });

  describe("getBlockInfo", () => {
    it("should call getBlockInfo with height and currency", async () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      const mockBlockInfo = { height: 600, hash: "block-600", time: new Date() };
      getBlockInfoMock.mockResolvedValue(mockBlockInfo);

      const result = await api.getBlockInfo(600);

      expect(getBlockInfoMock).toHaveBeenCalledWith(600, "concordium_testnet");
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("unsupported methods", () => {
    it("should throw error for getBlock", () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      expect(() => api.getBlock(500)).toThrow("getBlock is not supported");
    });

    it("should throw error for getStakes", () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      expect(() => api.getStakes("address")).toThrow("getStakes is not supported");
    });

    it("should throw error for getRewards", () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      expect(() => api.getRewards("address")).toThrow("getRewards is not supported");
    });

    it("should throw error for getValidators", () => {
      const api = createApi(TESTNET_COIN_CONFIG, "concordium_testnet");
      expect(() => api.getValidators()).toThrow("getValidators is not supported");
    });
  });
});
