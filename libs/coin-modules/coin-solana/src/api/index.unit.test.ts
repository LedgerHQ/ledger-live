import type {
  Balance,
  BalanceOptions,
  CraftedTransaction,
  Operation,
  Page,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";
import type { SolanaCoinConfig, SolanaContext } from "../config";
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
import { getValidators } from "../logic/getValidators";
import { ChainAPI } from "../network";

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

jest.mock("../logic/getValidators", () => ({
  getValidators: jest.fn(),
}));

describe("createApi", () => {
  const mockConfig: SolanaCoinConfig = {
    token2022Enabled: false,
    legacyOCMSMaxVersion: "1.0.0",
    status: { type: "active" },
    validatorsUrl: "https://solana-validators.com",
  };

  const context: SolanaContext = {
    config: async () => mockConfig,
    logger: () => {},
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("declares every method the chain supports", () => {
    const api = createApi("solana");

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
        getStakes: expect.any(Function),
        getValidators: expect.any(Function),
        validateIntent: expect.any(Function),
        getNextSequence: expect.any(Function),
        validateAddress: expect.any(Function),
      }),
    );
  });

  it("should pass parameters correctly to broadcast", async () => {
    jest.mocked(broadcast).mockResolvedValueOnce("txHash");

    const api = createApi("solana");
    const result = await api.broadcast(context, "transaction");

    expect(broadcast).toHaveBeenCalledWith(mockChainAPI, "transaction");
    expect(result).toBe("txHash");
  });

  it("should pass parameters correctly to getBalance and return its result", async () => {
    const mockBalances: Balance[] = [{ value: BigInt(1000), asset: { type: "native" as const } }];
    jest.mocked(getBalance).mockResolvedValueOnce(mockBalances);

    const api = createApi("solana");
    const result = await api.getBalance(context, "address");

    expect(getBalance).toHaveBeenCalledWith(mockChainAPI, "address", {
      token2022Enabled: false,
    });
    expect(result).toEqual(mockBalances);
  });

  it("should pass parameters correctly to lastBlock", async () => {
    const mockedDate = new Date();
    jest.mocked(lastBlock).mockResolvedValueOnce({ height: 100, hash: "hash", time: mockedDate });
    const api = createApi("solana");
    const result = await api.lastBlock(context);

    expect(lastBlock).toHaveBeenCalledWith(mockChainAPI);
    expect(result).toEqual({ height: 100, hash: "hash", time: mockedDate });
  });

  it("should pass parameters correctly to combine", async () => {
    jest.mocked(combine).mockReturnValueOnce("txHash");
    const api = createApi("solana");
    const result = await api.combine(context, "transaction", ["signature"]);

    expect(combine).toHaveBeenCalledWith("transaction", ["signature"]);
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

    const api = createApi("solana");
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(1000000),
      asset: { type: "native" },
    };
    const customFees = { value: 10000n };
    const result = await api.craftTransaction(context, intent, { customFees });

    expect(craftTransaction).toHaveBeenCalledWith(mockChainAPI, intent, customFees);
    expect(result).toEqual(mockResult);
  });

  it("should pass parameters correctly to craftRawTransaction", async () => {
    const mockResult: CraftedTransaction = {
      transaction: "base64tx",
      details: { recentBlockhash: "recentBlockhash" },
    };
    jest.mocked(craftRawTransaction).mockResolvedValueOnce(mockResult);

    const api = createApi("solana");
    const result = await api.craftRawTransaction(context, "tx", "sender", "pubkey", 42n);

    expect(craftRawTransaction).toHaveBeenCalledWith("tx", "sender");
    expect(result).toEqual(mockResult);
  });

  it("should pass parameters correctly to estimateFees", async () => {
    const mockResult = { value: 5000n };
    jest.mocked(estimateFees).mockResolvedValueOnce(mockResult);

    const api = createApi("solana");
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(1000000),
      asset: { type: "native" },
    };
    const result = await api.estimateFees(context, intent);

    expect(estimateFees).toHaveBeenCalledWith(mockChainAPI, intent, undefined);
    expect(result).toEqual(mockResult);
  });

  it("should pass parameters correctly to listOperations", async () => {
    const mockResult: Page<Operation> = { items: [], next: "next" };
    jest.mocked(listOperations).mockResolvedValueOnce(mockResult);

    const api = createApi("solana");
    const result = await api.listOperations(context, "address", { minHeight: 14, order: "asc" });

    expect(listOperations).toHaveBeenCalledWith(mockChainAPI, "address", {
      minHeight: 14,
      order: "asc",
    });
    expect(result).toEqual(mockResult);
  });

  it("should delegate getStakes to the logic function", async () => {
    const mockResult = { items: [] };
    jest.mocked(getStakes).mockResolvedValueOnce(mockResult);

    const api = createApi("solana");
    const result = await api.getStakes(context, "address");

    expect(getStakes).toHaveBeenCalledWith(mockChainAPI, "address", undefined);
    expect(result).toEqual(mockResult);
  });

  it("should delegate validateIntent to the logic function", async () => {
    const mockResult = { errors: {}, warnings: {}, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    jest.mocked(validateIntent).mockResolvedValueOnce(mockResult);

    const api = createApi("solana");
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: 10n,
      asset: { type: "native" },
    };
    const result = await api.validateIntent(context, intent, [], undefined);

    expect(validateIntent).toHaveBeenCalledWith(mockChainAPI, intent, [], undefined);
    expect(result).toEqual(mockResult);
  });

  it("should delegate getNextSequence to the logic function", async () => {
    jest.mocked(getNextSequence).mockReturnValueOnce(42n);

    const api = createApi("solana");
    const result = await api.getNextSequence(context, "address");

    expect(getNextSequence).toHaveBeenCalledWith("address");
    expect(result).toBe(42n);
  });

  it("should delegate validateAddress to the logic function", async () => {
    jest.mocked(validateAddress).mockResolvedValueOnce(true);

    const api = createApi("solana");
    const result = await api.validateAddress(context, "address", {});

    expect(validateAddress).toHaveBeenCalledWith("address", {});
    expect(result).toBe(true);
  });

  it("should delegate getValidators to the logic function", async () => {
    jest.mocked(getValidators).mockResolvedValueOnce({
      items: [
        {
          id: "validator",
          address: "validator",
          name: "validator",
          balance: 10n,
          commissionRate: "0",
          apy: 0.05,
        },
      ],
      next: undefined,
    });

    const api = createApi("solana");
    const result = await api.getValidators(context);

    expect(getValidators).toHaveBeenCalledWith("https://solana-validators.com");
    expect(result).toEqual({
      items: [
        {
          id: "validator",
          address: "validator",
          name: "validator",
          balance: 10n,
          commissionRate: "0",
          apy: 0.05,
        },
      ],
      next: undefined,
    });
  });

  it("omits the capabilities the chain has none of", () => {
    const impl = createApi("solana");

    for (const method of ["call", "register", "getBlock", "getBlockInfo", "getRewards"] as const) {
      expect(impl).not.toHaveProperty(method);
    }
  });

  it("raises 'not supported' for those capabilities once withDefaults is applied", () => {
    // The consumer path: the resolver wraps the module, and the wrapper is what answers.
    const api = withDefaults(createApi("solana"));

    expect(() => api.getBlock(context, 1)).toThrow("getBlock is not supported");
    expect(() => api.getBlockInfo(context, 1)).toThrow("getBlockInfo is not supported");
    expect(() => api.getRewards(context, "addr")).toThrow("getRewards is not supported");

    // What the chain does support keeps its real implementation.
    expect(api.supports("getStakes")).toBe(true);
    expect(api.supports("getValidators")).toBe(true);
  });

  describe("getBalance", () => {
    it("should throw an exception when options is provided", async () => {
      const api = createApi("solana");
      await expect(
        api.getBalance(context, "random address", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({ name: "InvalidParameterError" });
    });
  });
});
