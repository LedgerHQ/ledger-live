import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedCoinFrameworkOperation } from "../__tests__/fixtures/operation.fixture";
import { createMockTransactionIntent } from "../__tests__/fixtures/transaction.fixture";
import {
  craftTransaction,
  estimateFees,
  getAccountInfo,
  lastBlock,
  listOperations,
} from "../logic";
import { getTransactionType } from "../logic/utils";
import type { AleoContext } from "../types";
import { createApi } from "./index";

jest.mock("../logic");
jest.mock("../logic/utils");

describe("createApi", () => {
  const api = createApi("aleo");
  const mockConfig = getMockedConfig("testnet");
  const context: AleoContext = {
    config: async () => mockConfig,
    logger: () => {},
  };
  const mockOperation = getMockedCoinFrameworkOperation();
  const mockedCraftTransaction = jest.mocked(craftTransaction);
  const mockedEstimateFees = jest.mocked(estimateFees);
  const mockedGetAccountInfo = jest.mocked(getAccountInfo);
  const mockedLastBlock = jest.mocked(lastBlock);
  const mockedListOperations = jest.mocked(listOperations);
  const mockedGetTransactionType = jest.mocked(getTransactionType);

  beforeEach(() => {
    jest.clearAllMocks();

    mockedCraftTransaction.mockResolvedValue({ transaction: "crafted_tx" });
    mockedEstimateFees.mockReturnValue({ value: BigInt(1234) });
    mockedLastBlock.mockResolvedValue({ hash: "blockHash", height: 42, time: new Date() });
    mockedListOperations.mockResolvedValue({
      operations: [mockOperation],
      tokenOperations: [],
      calTokens: new Map(),
      nextCursor: "next-cursor",
    });
    mockedGetTransactionType.mockReturnValue("transfer_public");
  });

  it("should return an API object with coin module api methods", () => {
    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
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
      const enrolledContext: AleoContext = { ...context, provableId: "scan-uuid-123" };

      const result = await api.getAccountInfo!(enrolledContext, "aleo1test");

      expect(mockedGetAccountInfo).toHaveBeenCalledTimes(1);
      expect(mockedGetAccountInfo).toHaveBeenCalledWith(mockConfig, "scan-uuid-123");
      expect(result).toEqual(accountInfo);
    });

    it("returns { type: 'none' } and makes no scanner call when no provableId is on the context", async () => {
      const result = await api.getAccountInfo!(context, "aleo1test");

      expect(result).toEqual({ type: "none" });
      expect(mockedGetAccountInfo).not.toHaveBeenCalled();
    });

    it("returns { type: 'none' } when provableId is present but empty", async () => {
      const emptyContext: AleoContext = { ...context, provableId: "" };

      const result = await api.getAccountInfo!(emptyContext, "aleo1test");

      expect(result).toEqual({ type: "none" });
      expect(mockedGetAccountInfo).not.toHaveBeenCalled();
    });
  });

  describe("broadcast", () => {
    it("should throw unsupported error", () => {
      expect(() => api.broadcast(context, "test-signature")).toThrow("broadcast is not supported");
    });
  });

  describe("combine", () => {
    it("should throw unsupported error", () => {
      expect(() =>
        api.combine(context, "transaction", ["signature"], { pubkey: "publicKey" }),
      ).toThrow("combine is not supported");
    });
  });

  describe("craftTransaction", () => {
    it("should throw unsupported error", async () => {
      // @ts-expect-error - it should throw no matter what the input is
      expect(() => api.craftTransaction(context, {})).toThrow("craftTransaction is not supported");
    });
  });

  describe("craftRawTransaction", () => {
    it("should throw unsupported error", () => {
      expect(() =>
        api.craftRawTransaction(context, "transaction", "sender", "publicKey", BigInt(1)),
      ).toThrow("craftRawTransaction is not supported");
    });
  });

  describe("estimateFees", () => {
    it("should call estimateFees and return fee estimation", async () => {
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

  describe("getBlock", () => {
    it("should throw unsupported error", () => {
      expect(() => api.getBlock(context, 123)).toThrow("getBlock is not supported");
    });
  });

  describe("getBlockInfo", () => {
    it("should throw unsupported error", () => {
      expect(() => api.getBlockInfo(context, 123)).toThrow("getBlockInfo is not supported");
    });
  });

  describe("getRewards", () => {
    it("should throw unsupported error", () => {
      expect(() => api.getRewards(context, "aleo1test")).toThrow("getRewards is not supported");
    });
  });

  describe("getNextSequence", () => {
    it("should throw unsupported error", async () => {
      expect(() => api.getNextSequence(context, "aleo1test")).toThrow(
        "getNextSequence is not supported",
      );
    });
  });

  describe("getStakes", () => {
    it("should throw unsupported error", () => {
      expect(() => api.getStakes(context, "aleo1test")).toThrow("getStakes is not supported");
    });
  });

  describe("getValidators", () => {
    it("should throw unsupported error", () => {
      expect(() => api.getValidators(context)).toThrow("getValidators is not supported");
    });
  });

  describe("lastBlock", () => {
    it("should call lastBlock and return block info", async () => {
      const result = await api.lastBlock(context);

      expect(mockedLastBlock).toHaveBeenCalledTimes(1);
      expect(mockedLastBlock).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toMatchObject({ hash: "blockHash", height: 42 });
    });
  });

  describe("listOperations", () => {
    it("should call listOperations and return operations with proper structure", async () => {
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
