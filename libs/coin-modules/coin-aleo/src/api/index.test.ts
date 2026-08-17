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
  getAccountInfo,
  getBalance,
  lastBlock,
  listOperations,
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
  const mockedGetAccountInfo = jest.mocked(getAccountInfo);
  const mockedGetBalance = jest.mocked(getBalance);
  const mockedLastBlock = jest.mocked(lastBlock);
  const mockedListOperations = jest.mocked(listOperations);
  const mockedGetTransactionType = jest.mocked(getTransactionType);

  beforeEach(() => {
    jest.clearAllMocks();

    mockedCraftTransaction.mockResolvedValue({ transaction: "crafted_tx" });
    mockedEstimateFees.mockReturnValue({ value: BigInt(1234) });
    mockedGetBalance.mockResolvedValue([{ value: BigInt(10), asset: { type: "native" } }]);
    mockedLastBlock.mockResolvedValue({ hash: "blockHash", height: 42, time: new Date() });
    mockedListOperations.mockResolvedValue({
      operations: [mockOperation],
      tokenOperations: [],
      calTokens: new Map(),
      nextCursor: "next-cursor",
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
    expect(api.getAccountInfo).toBeInstanceOf(Function);
  });

  describe("getAccountInfo", () => {
    const accountInfo = {
      type: "aleo" as const,
      synced: true,
      percentage: 100,
      startHeight: 0,
      scannedHeight: 20985061,
    };

    it("reads the provableId off the context and returns the scan status", async () => {
      mockedGetAccountInfo.mockResolvedValue(accountInfo);
      const api = createApi("aleo");
      const enrolledContext: AleoContext = { ...context, provableId: "scan-uuid-123" };

      const result = await api.getAccountInfo!(enrolledContext, "aleo1test");

      expect(mockedGetAccountInfo).toHaveBeenCalledTimes(1);
      expect(mockedGetAccountInfo).toHaveBeenCalledWith(mockConfig, "scan-uuid-123");
      expect(result).toEqual(accountInfo);
    });

    it("returns { type: 'none' } and makes no scanner call when no provableId is on the context", async () => {
      const api = createApi("aleo");

      const result = await api.getAccountInfo!(context, "aleo1test");

      expect(result).toEqual({ type: "none" });
      expect(mockedGetAccountInfo).not.toHaveBeenCalled();
    });

    it("returns { type: 'none' } when provableId is present but empty", async () => {
      const api = createApi("aleo");
      const emptyContext: AleoContext = { ...context, provableId: "" };

      const result = await api.getAccountInfo!(emptyContext, "aleo1test");

      expect(result).toEqual({ type: "none" });
      expect(mockedGetAccountInfo).not.toHaveBeenCalled();
    });
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
        api.combine(context, "transaction", ["signature"], { pubkey: "publicKey" }),
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
    it("should call listOperations and return operations with proper structure", async () => {
      const api = createApi("aleo");
      const options = { minHeight: 10, limit: 5 };
      const result = await api.listOperations(context, "aleo1test", options);

      expect(mockedListOperations).toHaveBeenCalledTimes(1);
      expect(mockedListOperations).toHaveBeenCalledWith({
        config: mockConfig,
        currencyId: "aleo",
        address: "aleo1test",
        options,
        mode: "coin-framework",
      });
      expect(result).toEqual({ items: [mockOperation], next: "next-cursor" });
    });

    it("should return undefined next when listOperations has no next cursor", async () => {
      const api = createApi("aleo");
      mockedListOperations.mockResolvedValueOnce({
        operations: [mockOperation],
        tokenOperations: [],
        calTokens: new Map(),
        nextCursor: null,
      });
      const result = await api.listOperations(context, "aleo1test", { minHeight: 1 });

      expect(result).toEqual({ items: [mockOperation], next: undefined });
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

  describe("register", () => {
    it("should throw unsupported error", async () => {
      const api = createApi("aleo");

      await expect(api.register(context, "aleo1test")).rejects.toThrow("register is not supported");
    });
  });
});
