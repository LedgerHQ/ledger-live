import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { createFixtureConfig, createFixtureContext, VALID_ADDRESS } from "../test/fixtures";
import type { ConcordiumContext } from "../types";
import { createApi } from ".";

const logger = jest.fn();
const context = { ...createFixtureContext(), logger };
/** The logic receives a context pinned to the resolved config, not the caller's own. */
const pinned = expect.objectContaining({ logger, config: expect.any(Function) });

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

describe("api/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(createApi(), context)).resolves.toEqual({
      supported: ["craftRawTransaction", "getBlock", "getBlockInfo", "validateAddress"],
      inconsistent: [],
    });
  });
  it("declares every method the chain supports", () => {
    expect(createApi()).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getAccountStatus: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      craftTransactionData: expect.any(Function),
    });
  });

  describe("getAccountStatus", () => {
    it("rejects with the abort reason of the context signal", async () => {
      const controller = new AbortController();
      const reason = new Error("aborted");
      controller.abort(reason);

      await expect(
        createApi().getAccountStatus({ ...context, signal: controller.signal }, "ab"),
      ).rejects.toBe(reason);
    });
  });

  describe("broadcast", () => {
    it("should call broadcast with transaction and currency", async () => {
      const api = createApi();
      broadcastMock.mockResolvedValue("tx-hash-123");

      const result = await api.broadcast(context, "signed-tx-data");

      expect(broadcastMock).toHaveBeenCalledWith(pinned, "signed-tx-data");
      expect(result).toBe("tx-hash-123");
    });
  });

  describe("getBalance", () => {
    it("should call getBalance with address and currency", async () => {
      const api = createApi();
      const mockBalances = [{ asset: { type: "native" }, value: BigInt(5000000) }];
      getBalanceMock.mockResolvedValue(mockBalances);

      const result = await api.getBalance(context, VALID_ADDRESS);

      expect(getBalanceMock).toHaveBeenCalledWith(pinned, VALID_ADDRESS);
      expect(result).toEqual(mockBalances);
    });

    it("should throw an exception when options is provided", async () => {
      const api = createApi();
      await expect(
        api.getBalance(context, "random address", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({ name: "InvalidParameterError" });
    });
  });

  describe("lastBlock", () => {
    it("should call lastBlock with currency", async () => {
      const api = createApi();
      const mockBlockInfo = { height: 1000, hash: "block-hash", time: new Date() };
      lastBlockMock.mockResolvedValue(mockBlockInfo);

      const result = await api.lastBlock(context);

      expect(lastBlockMock).toHaveBeenCalledWith(pinned);
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("listOperations", () => {
    it("should call listOperations with address, pagination and currency", async () => {
      const api = createApi();
      const mockRawPage = {
        items: [
          {
            hash: "aa".repeat(32),
            type: "OUT",
            sender: VALID_ADDRESS,
            recipient: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
            amount: "1000000",
            fee: "500",
            transactionFee: "500",
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

      const result = await api.listOperations(context, VALID_ADDRESS, pagination);

      expect(listOperationsMock).toHaveBeenCalledWith(pinned, VALID_ADDRESS, pagination);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe("OUT");
      expect(result.items[0].value).toBe(BigInt(1000000));
      expect(result.items[0].tx.fees).toBe(BigInt(500));
      expect(result.next).toBeUndefined();
    });
  });

  describe("getBlockInfo", () => {
    it("should call getBlockInfo with height and currency", async () => {
      const api = createApi();
      const mockBlockInfo = { height: 600, hash: "block-600", time: new Date() };
      getBlockInfoMock.mockResolvedValue(mockBlockInfo);

      const result = await api.getBlockInfo(context, 600);

      expect(getBlockInfoMock).toHaveBeenCalledWith(pinned, 600);
      expect(result).toEqual(mockBlockInfo);
    });
  });

  describe("getBlock", () => {
    it("should call getBlock with height and currency", async () => {
      const api = createApi();
      const mockBlock = {
        info: { height: 600, hash: "block-600", time: new Date() },
        transactions: [],
      };
      getBlockMock.mockResolvedValue(mockBlock);

      const result = await api.getBlock(context, 600);

      expect(getBlockMock).toHaveBeenCalledWith(pinned, 600);
      expect(result).toEqual(mockBlock);
    });

    it("hands the logic a context pinned to the config resolved once for the call", async () => {
      const first = createFixtureConfig({ proxyUrl: "https://first.example" });
      const config = jest
        .fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValue(createFixtureConfig({ proxyUrl: "https://second.example" }));
      getBlockMock.mockImplementation(async (logicContext: ConcordiumContext) => {
        await expect(logicContext.config()).resolves.toBe(first);
        await expect(logicContext.config("other")).resolves.toBe(first);
      });

      await createApi().getBlock({ config, logger }, 600);

      expect(config).toHaveBeenCalledTimes(1);
    });
  });
});
