import type {
  BalanceOptions,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedCoinFrameworkOperation } from "../__tests__/fixtures/operation.fixture";
import {
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
  listOperationsFramework,
  resolvePrivateContext,
} from "../logic";
import { getTransactionType } from "../logic/utils";
import type { AleoContext, AleoTransactionIntentData } from "../types";
import { createApi } from "./index";

jest.mock("../logic");
jest.mock("../logic/utils");

describe("createApi", () => {
  const mockConfig = getMockedConfig("testnet");
  const context: AleoContext = {
    config: async () => mockConfig,
    logger: () => {},
  };
  const mockOperation = getMockedCoinFrameworkOperation();
  const mockedCraftTransaction = jest.mocked(craftTransaction);
  const mockedEstimateFees = jest.mocked(estimateFees);
  const mockedGetBalance = jest.mocked(getBalance);
  const mockedLastBlock = jest.mocked(lastBlock);
  const mockedListOperations = jest.mocked(listOperations);
  const mockedListOperationsFramework = jest.mocked(listOperationsFramework);
  const mockedResolvePrivateContext = jest.mocked(resolvePrivateContext);
  const mockedGetTransactionType = jest.mocked(getTransactionType);
  const privateContext: AleoContext = {
    ...context,
    provableId: "uuid-1",
    viewKey: "AViewKey1secret",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedCraftTransaction.mockResolvedValue({ transaction: "crafted_tx" });
    mockedEstimateFees.mockReturnValue({ value: BigInt(1234) });
    mockedGetBalance.mockResolvedValue([{ value: BigInt(10), asset: { type: "native" } }]);
    mockedLastBlock.mockResolvedValue({ hash: "blockHash", height: 42, time: new Date() });
    mockedResolvePrivateContext.mockReturnValue({
      provableId: "uuid-1",
      viewKey: "AViewKey1secret",
    });
    mockedListOperations.mockResolvedValue({
      operations: [mockOperation],
      tokenOperations: [],
      calTokens: new Map(),
      nextCursor: "public-cursor",
    });
    mockedListOperationsFramework.mockResolvedValue({
      items: [mockOperation],
      next: "next-cursor",
    });
    mockedGetTransactionType.mockReturnValue("transfer_public");
  });

  const createMockTransactionIntent = (): TransactionIntent<
    MemoNotSupported,
    AleoTransactionIntentData
  > => ({
    intentType: "transaction",
    asset: { type: "native" },
    type: "fee_public",
    amount: BigInt(1000),
    sender: "aleo1sender1234567890123456789012345678901234567",
    recipient: "aleo1recipient123456789012345678901234567890",
    data: { type: "fee_public", priorityFee: 1040n, executionId: "ex1test" },
  });

  it("should return an API object with coin module api methods", () => {
    const api = createApi("aleo");

    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.getBlock).toBeInstanceOf(Function);
    expect(api.getBlockInfo).toBeInstanceOf(Function);
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
    expect(api.craftTransactionData).toBeInstanceOf(Function);
  });

  describe("broadcast", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() => api.broadcast(context, "test-signature")).toThrow("broadcast is not supported");
    });
  });

  describe("combine", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() =>
        api.combine(context, "transaction", "signature", { pubkey: "publicKey" }),
      ).toThrow("combine is not supported");
    });
  });

  describe("craftTransaction", () => {
    it("should throw unsupported error", async () => {
      const api = createApi("aleo");

      // @ts-expect-error - it should throw no matter what the input is
      expect(() => api.craftTransaction(context, {})).toThrow("craftTransaction is not supported");
    });
  });

  describe("craftRawTransaction", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() =>
        api.craftRawTransaction(context, "transaction", "sender", "publicKey", BigInt(1)),
      ).toThrow("craftRawTransaction is not supported");
    });
  });

  describe("estimateFees", () => {
    it("should call estimateFees and return fee estimation", async () => {
      const api = createApi("aleo");
      const txIntent = createMockTransactionIntent();
      const result = await api.estimateFees(context, txIntent);

      expect(mockedGetTransactionType).toHaveBeenCalledTimes(1);
      expect(mockedGetTransactionType).toHaveBeenCalledWith(txIntent);
      expect(mockedEstimateFees).toHaveBeenCalledTimes(1);
      expect(mockedEstimateFees).toHaveBeenCalledWith({
        configOrCurrencyId: expect.objectContaining({ status: { type: "active" } }),
        transactionType: "transfer_public",
      });
      expect(result).toEqual({ value: BigInt(1234) });
    });
  });

  describe("getBalance", () => {
    it("should call getBalance and return balances", async () => {
      const api = createApi("aleo");
      const result = await api.getBalance(context, "aleo1test");

      expect(mockedGetBalance).toHaveBeenCalledTimes(1);
      expect(mockedGetBalance).toHaveBeenCalledWith(expect.any(Object), "aleo1test");
      expect(result).toEqual([{ value: BigInt(10), asset: { type: "native" } }]);
    });

    it("should throw an exception when options is provided", async () => {
      const api = createApi("aleo");
      await expect(
        api.getBalance(context, "", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({
        name: "InvalidParameterError",
      });
    });
  });

  describe("getBlock", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() => api.getBlock(context, 123)).toThrow("getBlock is not supported");
    });
  });

  describe("getBlockInfo", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() => api.getBlockInfo(context, 123)).toThrow("getBlockInfo is not supported");
    });
  });

  describe("getRewards", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() => api.getRewards(context, "aleo1test")).toThrow("getRewards is not supported");
    });
  });

  describe("getNextSequence", () => {
    it("should throw unsupported error", async () => {
      const api = createApi("aleo");

      expect(() => api.getNextSequence(context, "aleo1test")).toThrow(
        "getNextSequence is not supported",
      );
    });
  });

  describe("getStakes", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() => api.getStakes(context, "aleo1test")).toThrow("getStakes is not supported");
    });
  });

  describe("getValidators", () => {
    it("should throw unsupported error", () => {
      const api = createApi("aleo");

      expect(() => api.getValidators(context)).toThrow("getValidators is not supported");
    });
  });

  describe("lastBlock", () => {
    it("should call lastBlock and return block info", async () => {
      const api = createApi("aleo");
      const result = await api.lastBlock(context);

      expect(mockedLastBlock).toHaveBeenCalledTimes(1);
      expect(mockedLastBlock).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toMatchObject({ hash: "blockHash", height: 42 });
    });
  });

  describe("listOperations", () => {
    it("should delegate to listOperationsFramework with the resolved private context", async () => {
      const api = createApi("aleo");
      const options = { minHeight: 10, limit: 5 };
      const result = await api.listOperations(privateContext, "aleo1test", options);

      expect(mockedResolvePrivateContext).toHaveBeenCalledWith(privateContext, "aleo1test");
      expect(mockedListOperationsFramework).toHaveBeenCalledTimes(1);
      expect(mockedListOperationsFramework).toHaveBeenCalledWith({
        config: mockConfig,
        address: "aleo1test",
        options,
        provableId: "uuid-1",
        viewKey: "AViewKey1secret",
      });
      expect(result).toEqual({ items: [mockOperation], next: "next-cursor" });
    });

    it("should fall back to the public-only listing when the context carries no pair", async () => {
      const api = createApi("aleo");
      const options = { minHeight: 10, limit: 5 };
      mockedResolvePrivateContext.mockReturnValueOnce(null);

      const result = await api.listOperations(context, "aleo1test", options);

      expect(mockedListOperations).toHaveBeenCalledWith({
        config: mockConfig,
        currencyId: "aleo",
        address: "aleo1test",
        options,
        mode: "coin-framework",
      });
      expect(mockedListOperationsFramework).not.toHaveBeenCalled();
      expect(result).toEqual({ items: [mockOperation], next: "public-cursor" });
    });

    it("should reject an incomplete pair before resolving the config", async () => {
      const api = createApi("aleo");
      const configSpy = jest.fn(async () => mockConfig);
      mockedResolvePrivateContext.mockImplementation(() => {
        throw new Error("INVALID_ARGS");
      });

      await expect(
        api.listOperations({ ...context, config: configSpy }, "aleo1test", { minHeight: 1 }),
      ).rejects.toThrow("INVALID_ARGS");
      expect(configSpy).not.toHaveBeenCalled();
      expect(mockedListOperationsFramework).not.toHaveBeenCalled();
    });
  });

  describe("validateIntent", () => {
    it("should throw unsupported error", async () => {
      const api = createApi("aleo");
      const txIntent = createMockTransactionIntent();

      expect(() => api.validateIntent(context, txIntent, [])).toThrow(
        "validateIntent is not supported",
      );
    });
  });
});
