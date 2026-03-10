import type { AlpacaApi, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import coinConfig from "../config";
import type { SolanaConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getStakes,
  lastBlock,
  listOperations,
} from "../logic";
import { ChainAPI } from "../network";
import { createApi } from ".";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

const mockChainAPI = {} as unknown as ChainAPI;

jest.mock("../network", () => ({
  getChainAPI: () => mockChainAPI,
}));

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftRawTransaction: jest.fn().mockResolvedValue({ transaction: "base64tx" }),
  craftTransaction: jest.fn(),
  estimateFees: jest.fn().mockResolvedValue({ value: 5000n }),
  getBalance: jest.fn(),
  getStakes: jest.fn().mockResolvedValue({ items: [] }),
  lastBlock: jest.fn(),
  listOperations: jest.fn().mockResolvedValue({ items: [], next: undefined }),
}));

describe("createApi", () => {
  const mockConfig: SolanaConfig & { endpoint: string } = {
    endpoint: "https://api.mainnet-beta.solana.com",
    token2022Enabled: false,
    legacyOCMSMaxVersion: "1.0.0",
  };

  let setCoinConfigSpy: jest.SpyInstance;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set the coin config value", () => {
    setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockConfig);

    const config = setCoinConfigSpy.mock.calls[0][0]();

    expect(setCoinConfigSpy).toHaveBeenCalled();
    expect(config).toEqual(
      expect.objectContaining({
        ...mockConfig,
        status: { type: "active" },
      }),
    );
  });

  it("should return an object with all AlpacaApi methods", () => {
    const api = createApi(mockConfig);

    expect(api).toEqual(
      expect.objectContaining({
        broadcast: expect.any(Function),
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        craftRawTransaction: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: expect.any(Function),
        lastBlock: expect.any(Function),
        listOperations: expect.any(Function),
        getBlock: expect.any(Function),
        getBlockInfo: expect.any(Function),
        getStakes: expect.any(Function),
        getRewards: expect.any(Function),
        getValidators: expect.any(Function),
      }),
    );
  });

  it("should pass parameters correctly to logic functions", async () => {
    const api: AlpacaApi = createApi(mockConfig);
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: { type: "native" },
    };

    await api.broadcast("transaction");
    api.combine("tx", "signature", "pubkey");
    await api.craftTransaction(intent);
    await api.estimateFees(intent);
    await api.getBalance("address");
    await api.lastBlock();
    await api.listOperations("address", { minHeight: 14, order: "asc" });

    expect(broadcast).toHaveBeenCalledWith(mockChainAPI, "transaction");
    expect(combine).toHaveBeenCalledWith("tx", "signature", "pubkey");
    expect(craftTransaction).toHaveBeenCalledWith(mockChainAPI, intent, undefined);
    expect(estimateFees).toHaveBeenCalledWith(mockChainAPI, intent, undefined);
    expect(getBalance).toHaveBeenCalledWith(mockChainAPI, "address");
    expect(lastBlock).toHaveBeenCalledWith(mockChainAPI);
    expect(listOperations).toHaveBeenCalledWith(mockChainAPI, "address", {
      minHeight: 14,
      order: "asc",
    });
  });

  it("should throw for unsupported methods", () => {
    const api = createApi(mockConfig);

    expect(() => api.getRewards("addr")).toThrow("getRewards is not supported");
    expect(() => api.getValidators()).toThrow("getValidators is not supported");
    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
    expect(() => api.getBlockInfo(1)).toThrow("getBlockInfo is not supported");
  });

  it("should delegate getStakes to logic", async () => {
    const api = createApi(mockConfig);

    await api.getStakes("address");

    expect(getStakes).toHaveBeenCalledWith(mockChainAPI, "address", undefined);
  });

  it("should delegate craftRawTransaction to logic", async () => {
    const { craftRawTransaction } = jest.requireMock("../logic");
    const api = createApi(mockConfig);

    await api.craftRawTransaction("txBase64", "sender", "pubkey", 42n);

    expect(craftRawTransaction).toHaveBeenCalledWith(
      mockChainAPI,
      "txBase64",
      "sender",
      "pubkey",
      42n,
    );
  });
});
