/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AlpacaApi, Balance, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import coinConfig from "../config";
import type { SolanaCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { getBalance } from "../logic/getBalance";
import { lastBlock } from "../logic/lastBlock";
import { ChainAPI } from "../network";
import { createApi } from ".";

const mockChainAPI = {} as unknown as ChainAPI;

jest.mock("../network", () => ({
  getChainAPI: () => mockChainAPI,
}));

jest.mock("../logic/broadcast", () => ({
  broadcast: jest.fn(),
}));

jest.mock("../logic/lastBlock", () => ({
  lastBlock: jest.fn(),
}));

jest.mock("../logic/combine", () => ({
  combine: jest.fn(),
}));

jest.mock("../logic/getBalance", () => ({
  getBalance: jest.fn(),
}));

describe("createApi", () => {
  const mockConfig: SolanaCoinConfig = {
    token2022Enabled: false,
    legacyOCMSMaxVersion: "1.0.0",
    status: { type: "active" },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set the coin config value", () => {
    const setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockConfig, "solana");

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
    const api = createApi(mockConfig, "solana");

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
        validateIntent: expect.any(Function),
        getNextSequence: expect.any(Function),
        validateAddress: expect.any(Function),
      }),
    );
  });

  it("should pass parameters correctly to broadcast", async () => {
    jest.mocked(broadcast).mockResolvedValueOnce("txHash");

    const api: AlpacaApi = createApi(mockConfig, "solana");
    const result = await api.broadcast("transaction");

    expect(broadcast).toHaveBeenCalledWith(mockChainAPI, "transaction");
    expect(result).toBe("txHash");
  });

  it("should pass parameters correctly to getBalance and return its result", async () => {
    const mockBalances: Balance[] = [{ value: BigInt(1000), asset: { type: "native" as const } }];
    jest.mocked(getBalance).mockResolvedValueOnce(mockBalances);

    const api: AlpacaApi = createApi(mockConfig, "solana");
    const result = await api.getBalance("address");

    expect(getBalance).toHaveBeenCalledWith(mockChainAPI, "address", {
      token2022Enabled: false,
    });
    expect(result).toEqual(mockBalances);
  });

  it("should pass parameters correctly to lastBlock", async () => {
    const mockedDate = new Date();
    jest.mocked(lastBlock).mockResolvedValueOnce({ height: 100, hash: "hash", time: mockedDate });
    const api: AlpacaApi = createApi(mockConfig, "solana");
    const result = await api.lastBlock();

    expect(lastBlock).toHaveBeenCalledWith(mockChainAPI);
    expect(result).toEqual({ height: 100, hash: "hash", time: mockedDate });
  });

  it("should pass parameters correctly to combine", async () => {
    jest.mocked(combine).mockReturnValueOnce("txHash");
    const api: AlpacaApi = createApi(mockConfig, "solana");
    const result = await api.combine("transaction", "signature");

    expect(combine).toHaveBeenCalledWith("transaction", "signature");
    expect(result).toBe("txHash");
  });

  it("should throw for unsupported methods", () => {
    const api = createApi(mockConfig, "solana");

    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: { type: "native" },
    };

    expect(() => api.craftTransaction(intent)).toThrow("craftTransaction is not supported");
    expect(() => api.craftRawTransaction("tx", "sender", "pubkey", 42n)).toThrow(
      "craftRawTransaction is not supported",
    );
    expect(() => api.estimateFees(intent)).toThrow("estimateFees is not supported");
    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
    expect(() => api.getBlockInfo(1)).toThrow("getBlockInfo is not supported");
    expect(() => api.getRewards("addr")).toThrow("getRewards is not supported");
    expect(() => api.getStakes("address")).toThrow("getStakes is not supported");
    expect(() => api.getValidators()).toThrow("getValidators is not supported");
    expect(() => api.listOperations("address", { minHeight: 14, order: "asc" })).toThrow(
      "listOperations is not supported",
    );
    expect(() => api.validateIntent(intent, [])).toThrow("validateIntent is not supported");
    expect(() => api.getNextSequence("address")).toThrow("getNextSequence is not supported");
    expect(() => api.validateAddress("address", {})).toThrow("validateAddress is not supported");
  });
});
