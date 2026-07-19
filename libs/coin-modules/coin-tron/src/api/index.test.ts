import {
  CoinModuleApi,
  BalanceOptions,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { InvalidParameterError } from "@ledgerhq/errors";
import { createApi } from ".";
import coinConfig, { TronConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  estimateFees: jest.fn(),
  getBalance: jest.fn(),
  listOperations: jest.fn().mockResolvedValue({ items: [], next: undefined }),
  lastBlock: jest.fn(),
}));

jest.mock("../network", () => ({
  defaultFetchParams: { minTimestamp: 0 },
  getBlock: jest.fn().mockResolvedValue({ time: new Date(0) }),
}));

describe("createApi", () => {
  const mockTronConfig: TronConfig = { explorer: { url: "iamaurl" } } as TronConfig;
  let setCoinConfigSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set the coin config value", () => {
    setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockTronConfig);

    const config = setCoinConfigSpy.mock.calls[0][0]();

    expect(setCoinConfigSpy).toHaveBeenCalled();

    expect(config).toEqual(
      expect.objectContaining({
        ...mockTronConfig,
        status: { type: "active" },
      }),
    );
  });

  it("should pass parameters correctly", async () => {
    const api: CoinModuleApi = createApi(mockTronConfig);
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: {
        type: "trc10",
        assetReference: "1002000",
      },
    };
    // Simulate calling all methods
    await api.broadcast("transaction");
    api.combine("tx", "signature", "pubkey");
    await api.craftTransaction(intent);
    await api.estimateFees(intent);
    await api.getBalance("address");
    await api.lastBlock();
    const minHeight = 14;
    await api.listOperations("address", { minHeight, order: "asc" });

    // Test that each of the methods was called with correct arguments
    expect(broadcast).toHaveBeenCalledWith("transaction");
    expect(combine).toHaveBeenCalledWith("tx", "signature", "pubkey");
    expect(estimateFees).toHaveBeenCalledWith(intent);
    expect(craftTransaction).toHaveBeenCalledWith(intent);
    expect(getBalance).toHaveBeenCalledWith("address");
    expect(lastBlock).toHaveBeenCalled();
    expect(listOperations).toHaveBeenCalledWith("address", {
      limit: 200,
      minTimestamp: 0,
      order: "asc",
      cursor: undefined,
    });
  });

  it("should throw when limit > 200", async () => {
    const api: CoinModuleApi = createApi(mockTronConfig);
    await expect(api.listOperations("address", { minHeight: 0, limit: 201 })).rejects.toThrow(
      "limit must be <= 200 for Tron (TronGrid API restriction)",
    );
    expect(listOperations).not.toHaveBeenCalled();
  });

  it("should not throw when limit is exactly 200", async () => {
    const api: CoinModuleApi = createApi(mockTronConfig);
    await expect(api.listOperations("address", { minHeight: 0, limit: 200 })).resolves.toEqual({
      items: [],
      next: undefined,
    });
    expect(listOperations).toHaveBeenCalledWith(
      "address",
      expect.objectContaining({ limit: 200, minTimestamp: 0 }),
    );
  });

  describe("getBalance", () => {
    it("should throw an exception when options is provided", async () => {
      const api = createApi(mockTronConfig);
      await expect(
        api.getBalance("random address", {} as unknown as BalanceOptions),
      ).rejects.toThrow(InvalidParameterError);
    });
  });
});
