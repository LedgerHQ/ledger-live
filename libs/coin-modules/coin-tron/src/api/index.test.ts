import {
  CoinModuleApi,
  BalanceOptions,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";
import { TronCoinConfig, TronContext } from "../config";
import type { TronMemo, TronTxData } from "../types";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  estimateTronifyFees,
  getAccountInfo,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";
import { TRONIFY_FEE_OPTION_ID } from ".";

jest.mock("../logic", () => ({
  broadcast: jest.fn(),
  combine: jest.fn(),
  craftTransaction: jest.fn(),
  estimateFees: jest.fn(),
  estimateTronifyFees: jest.fn(),
  getAccountInfo: jest.fn(),
  getBalance: jest.fn(),
  listOperations: jest.fn().mockResolvedValue({ items: [], next: undefined }),
  lastBlock: jest.fn(),
}));

const mockEstimateFees = jest.mocked(estimateFees);
const mockEstimateTronifyFees = jest.mocked(estimateTronifyFees);

jest.mock("../network", () => ({
  defaultFetchParams: { minTimestamp: 0 },
  getBlock: jest.fn().mockResolvedValue({ time: new Date(0) }),
}));

describe("createApi", () => {
  it("omits the capabilities the chain has none of", () => {
    const impl = createApi();

    // Kept out rather than stubbed: Tron contract reads are unsupported, withdrawals already show
    // up in listOperations, the chain takes no externally-built transaction, and there is no
    // enrollment step. The consumer resolver answers "not supported" for each.
    for (const method of ["call", "register", "craftRawTransaction", "getRewards"] as const) {
      expect(impl).not.toHaveProperty(method);
    }
  });

  const mockTronConfig: TronCoinConfig = {
    explorer: { url: "iamaurl" },
    status: { type: "active" },
  } as TronCoinConfig;

  const context: TronContext = {
    config: jest.fn().mockResolvedValue(mockTronConfig),
    logger: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve the coin config from the context and thread it down", async () => {
    const api: CoinModuleApi<TronCoinConfig, TronMemo, TronTxData> = withDefaults(createApi());
    await api.getBalance(context, "address");

    expect(context.config).toHaveBeenCalled();
    expect(getBalance).toHaveBeenCalledWith(mockTronConfig, "address");
  });

  it("should pass parameters correctly", async () => {
    const api: CoinModuleApi<TronCoinConfig, TronMemo, TronTxData> = withDefaults(createApi());
    const intent: TransactionIntent<TronMemo, TronTxData> = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(10),
      asset: {
        type: "trc10",
        assetReference: "1002000",
      },
      data: { type: "tron" },
    };
    // Simulate calling all methods
    await api.broadcast(context, "transaction");
    api.combine(context, "tx", ["signature"], { pubkey: "pubkey" });
    await api.craftTransaction(context, intent);
    await api.estimateFees(context, intent);
    await api.getBalance(context, "address");
    await api.getAccountInfo!(context, "address");
    await api.lastBlock(context);
    const minHeight = 14;
    await api.listOperations(context, "address", { minHeight, order: "asc" });

    // Test that each of the methods was called with correct arguments, threading the config
    expect(broadcast).toHaveBeenCalledWith(mockTronConfig, "transaction");
    expect(combine).toHaveBeenCalledWith("tx", ["signature"]);
    expect(mockEstimateFees).toHaveBeenCalledWith(mockTronConfig, intent);
    expect(craftTransaction).toHaveBeenCalledWith(mockTronConfig, intent, undefined);
    expect(getBalance).toHaveBeenCalledWith(mockTronConfig, "address");
    expect(getAccountInfo).toHaveBeenCalledWith(mockTronConfig, "address");
    expect(lastBlock).toHaveBeenCalledWith(mockTronConfig);
    expect(listOperations).toHaveBeenCalledWith(mockTronConfig, "address", {
      limit: 200,
      minTimestamp: 0,
      order: "asc",
      cursor: undefined,
    });
  });

  it("should throw when limit > 200", async () => {
    const api: CoinModuleApi<TronCoinConfig, TronMemo, TronTxData> = withDefaults(createApi());
    await expect(
      api.listOperations(context, "address", { minHeight: 0, limit: 201 }),
    ).rejects.toThrow("limit must be <= 200 for Tron (TronGrid API restriction)");
    expect(listOperations).not.toHaveBeenCalled();
  });

  it("should not throw when limit is exactly 200", async () => {
    const api: CoinModuleApi<TronCoinConfig, TronMemo, TronTxData> = withDefaults(createApi());
    await expect(
      api.listOperations(context, "address", { minHeight: 0, limit: 200 }),
    ).resolves.toEqual({
      items: [],
      next: undefined,
    });
    expect(listOperations).toHaveBeenCalledWith(
      mockTronConfig,
      "address",
      expect.objectContaining({ limit: 200, minTimestamp: 0 }),
    );
  });

  describe("estimateFees routing", () => {
    const mockFeeEstimation = { value: 1_000_000n };

    beforeEach(() => {
      mockEstimateFees.mockResolvedValue(mockFeeEstimation);
      mockEstimateTronifyFees.mockResolvedValue(mockFeeEstimation);
    });

    const trc20Intent: TransactionIntent<TronMemo, TronTxData> = {
      intentType: "transaction",
      type: "send",
      sender: "sender",
      recipient: "recipient",
      amount: BigInt(1000),
      asset: { type: "trc20", assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" },
      data: { type: "tron" },
    };

    it("should call estimateFees when no feeOption is provided", async () => {
      const api = createApi();
      await api.estimateFees(context, trc20Intent);

      expect(mockEstimateFees).toHaveBeenCalledWith(mockTronConfig, trc20Intent);
      expect(mockEstimateTronifyFees).not.toHaveBeenCalled();
    });

    it("should call estimateTronifyFees when feeOptionId is TRONIFY_FEE_OPTION_ID", async () => {
      const api = createApi();
      await api.estimateFees(context, trc20Intent, {
        feeOption: { feeOptionId: TRONIFY_FEE_OPTION_ID },
      });

      expect(mockEstimateTronifyFees).toHaveBeenCalledWith(mockTronConfig, trc20Intent);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });

    it("should call estimateFees when feeOptionId is an unknown value", async () => {
      const api = createApi();
      await api.estimateFees(context, trc20Intent, { feeOption: { feeOptionId: "unknown" } });

      expect(mockEstimateFees).toHaveBeenCalledWith(mockTronConfig, trc20Intent);
      expect(mockEstimateTronifyFees).not.toHaveBeenCalled();
    });
  });

  describe("getBalance", () => {
    it("should throw an exception when options is provided", async () => {
      const api = withDefaults(createApi());
      await expect(
        api.getBalance(context, "random address", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({ name: "InvalidParameterError" });
    });
  });
});
