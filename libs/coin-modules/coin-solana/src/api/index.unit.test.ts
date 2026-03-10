import coinConfig from "../config";
import type { SolanaConfig } from "../config";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
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
  craftTransaction: jest.fn(),
  estimateFees: jest.fn().mockResolvedValue({ value: 5000n }),
  getBalance: jest.fn(),
  lastBlock: jest.fn(),
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

  it("should delegate estimateFees to logic", async () => {
    const api = createApi(mockConfig);
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: { type: "native" },
    };

    await api.estimateFees(intent);

    expect(estimateFees).toHaveBeenCalledWith(mockChainAPI, intent, undefined);
  });

  it("should delegate craftTransaction to logic", async () => {
    const api = createApi(mockConfig);
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: { type: "native" },
    };

    await api.craftTransaction(intent);

    expect(craftTransaction).toHaveBeenCalledWith(mockChainAPI, intent, undefined);
  });

  it("should delegate getBalance to logic", async () => {
    const api = createApi(mockConfig);

    await api.getBalance("address");

    expect(getBalance).toHaveBeenCalledWith(mockChainAPI, "address");
  });

  it("should delegate lastBlock to logic", async () => {
    const api = createApi(mockConfig);

    await api.lastBlock();

    expect(lastBlock).toHaveBeenCalledWith(mockChainAPI);
  });

  it("should delegate combine to logic", () => {
    const api = createApi(mockConfig);

    api.combine("tx", "signature", "pubkey");

    expect(combine).toHaveBeenCalledWith("tx", "signature", "pubkey");
  });

  it("should delegate broadcast to logic", async () => {
    const api = createApi(mockConfig);

    await api.broadcast("transaction");

    expect(broadcast).toHaveBeenCalledWith(mockChainAPI, "transaction");
  });

  it("should throw for unsupported methods", () => {
    const api = createApi(mockConfig);

    expect(() => api.craftRawTransaction("tx", "s", "pk", 0n)).toThrow("not supported");
    expect(() => api.getStakes("addr")).toThrow("not supported");
    expect(() => api.getBlock(1)).toThrow("not supported");
    expect(() => api.getBlockInfo(1)).toThrow("not supported");
    expect(() => api.getRewards("addr")).toThrow("not supported");
    expect(() => api.getValidators()).toThrow("not supported");
  });
});
