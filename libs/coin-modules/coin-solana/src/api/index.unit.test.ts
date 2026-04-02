/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type {
  AlpacaApi,
  Balance,
  CraftedTransaction,
  Operation,
  Page,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import coinConfig from "../config";
import type { SolanaCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftRawTransaction } from "../logic/craftRawTransaction";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getNextSequence } from "../logic/getNextSequence";
import { getStakes } from "../logic/getStakes";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";
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

jest.mock("../logic/craftTransaction", () => ({
  craftTransaction: jest.fn(),
}));

jest.mock("../logic/craftRawTransaction", () => ({
  craftRawTransaction: jest.fn(),
}));

jest.mock("../logic/estimateFees", () => ({
  estimateFees: jest.fn(),
}));

jest.mock("../logic/getBalance", () => ({
  getBalance: jest.fn(),
}));

jest.mock("../logic/listOperations", () => ({
  listOperations: jest.fn(),
}));

jest.mock("../logic/getStakes", () => ({
  getStakes: jest.fn(),
}));

jest.mock("../logic/getNextSequence", () => ({
  getNextSequence: jest.fn(),
}));

jest.mock("../logic/validateIntent", () => ({
  validateIntent: jest.fn(),
}));

jest.mock("../logic/validateAddress", () => ({
  validateAddress: jest.fn(),
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

  it("should pass parameters correctly to craftTransaction", async () => {
    const mockResult: CraftedTransaction = {
      transaction: "base64tx",
      details: {
        estimatedFee: "5000",
        lastValidBlockHeight: 100,
        recentBlockhash: "recentBlockhash",
      },
    };
    jest.mocked(craftTransaction).mockResolvedValueOnce(mockResult);

    const api: AlpacaApi = createApi(mockConfig, "solana");
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(1000000),
      asset: { type: "native" },
    };
    const customFees = { value: 10000n };
    const result = await api.craftTransaction(intent, customFees);

    expect(craftTransaction).toHaveBeenCalledWith(mockChainAPI, intent, customFees);
    expect(result).toEqual(mockResult);
  });

  it("should pass parameters correctly to craftRawTransaction", async () => {
    const mockResult: CraftedTransaction = {
      transaction: "base64tx",
      details: { recentBlockhash: "recentBlockhash" },
    };
    jest.mocked(craftRawTransaction).mockResolvedValueOnce(mockResult);

    const api: AlpacaApi = createApi(mockConfig, "solana");
    const result = await api.craftRawTransaction("tx", "sender", "pubkey", 42n);

    expect(craftRawTransaction).toHaveBeenCalledWith("tx", "sender");
    expect(result).toEqual(mockResult);
  });

  it("should pass parameters correctly to estimateFees", async () => {
    const mockResult = { value: 5000n };
    jest.mocked(estimateFees).mockResolvedValueOnce(mockResult);

    const api: AlpacaApi = createApi(mockConfig, "solana");
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(1000000),
      asset: { type: "native" },
    };
    const result = await api.estimateFees(intent);

    expect(estimateFees).toHaveBeenCalledWith(mockChainAPI, intent, undefined);
    expect(result).toEqual(mockResult);
  });

  it("should pass parameters correctly to listOperations", async () => {
    const mockResult: Page<Operation> = { items: [], next: "next" };
    jest.mocked(listOperations).mockResolvedValueOnce(mockResult);

    const api: AlpacaApi = createApi(mockConfig, "solana");
    const result = await api.listOperations("address", { minHeight: 14, order: "asc" });

    expect(listOperations).toHaveBeenCalledWith(mockChainAPI, "address", {
      minHeight: 14,
      order: "asc",
    });
    expect(result).toEqual(mockResult);
  });

  it("should delegate getStakes to the logic function", async () => {
    const mockResult = { items: [] };
    jest.mocked(getStakes).mockResolvedValueOnce(mockResult);

    const api = createApi(mockConfig, "solana");
    const result = await api.getStakes("address");

    expect(getStakes).toHaveBeenCalledWith(mockChainAPI, "address", undefined);
    expect(result).toEqual(mockResult);
  });

  it("should delegate validateIntent to the logic function", async () => {
    const mockResult = { errors: {}, warnings: {}, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    jest.mocked(validateIntent).mockResolvedValueOnce(mockResult);

    const api = createApi(mockConfig, "solana");
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: 10n,
      asset: { type: "native" },
    };
    const result = await api.validateIntent(intent, []);

    expect(validateIntent).toHaveBeenCalledWith(intent, [], undefined);
    expect(result).toEqual(mockResult);
  });

  it("should delegate getNextSequence to the logic function", async () => {
    jest.mocked(getNextSequence).mockReturnValueOnce(42n);

    const api = createApi(mockConfig, "solana");
    const result = await api.getNextSequence("address");

    expect(getNextSequence).toHaveBeenCalledWith("address");
    expect(result).toBe(42n);
  });

  it("should delegate validateAddress to the logic function", async () => {
    jest.mocked(validateAddress).mockResolvedValueOnce(true);

    const api = createApi(mockConfig, "solana");
    const result = await api.validateAddress("address", {});

    expect(validateAddress).toHaveBeenCalledWith("address", {});
    expect(result).toBe(true);
  });

  it("should throw for unsupported methods", () => {
    const api = createApi(mockConfig, "solana");

    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
    expect(() => api.getBlockInfo(1)).toThrow("getBlockInfo is not supported");
    expect(() => api.getRewards("addr")).toThrow("getRewards is not supported");
    expect(() => api.getValidators()).toThrow("getValidators is not supported");
  });
});
