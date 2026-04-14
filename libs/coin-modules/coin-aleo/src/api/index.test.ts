/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type {
  BalanceOptions,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { InvalidParameterError } from "@ledgerhq/errors";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAlpacaOperation } from "../__tests__/fixtures/operation.fixture";
import coinConfig from "../config";
import { craftTransaction, estimateFees, getBalance, lastBlock, listOperations } from "../logic";
import { getTransactionType } from "../logic/utils";
import type { AleoTransactionIntentData } from "../types";
import { createApi } from "./index";

jest.mock("../logic");
jest.mock("../logic/utils");

describe("createApi", () => {
  const mockConfig = getMockedConfig("testnet");
  const mockOperation = getMockedAlpacaOperation();
  const mockedCraftTransaction = jest.mocked(craftTransaction);
  const mockedEstimateFees = jest.mocked(estimateFees);
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

  it("should set the coin config value", () => {
    const mockSetCoinConfig = jest.spyOn(coinConfig, "setCoinConfig");
    createApi(mockConfig, "aleo");
    const config = coinConfig.getCoinConfig();

    expect(mockSetCoinConfig).toHaveBeenCalled();
    expect(config).toMatchObject({ status: { type: "active" } });
  });

  it("should return an API object with alpaca api methods", () => {
    const api = createApi(mockConfig, "aleo");

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
      const api = createApi(mockConfig, "aleo");

      expect(() => api.broadcast("test-signature")).toThrow("broadcast is not supported");
    });
  });

  describe("combine", () => {
    it("should throw unsupported error", () => {
      const api = createApi(mockConfig, "aleo");

      expect(() => api.combine("transaction", "signature", "publicKey")).toThrow(
        "combine is not supported",
      );
    });
  });

  describe("craftTransaction", () => {
    it("should throw unsupported error", async () => {
      const api = createApi(mockConfig, "aleo");

      // @ts-expect-error - it should throw no matter what the input is
      await expect(api.craftTransaction({})).rejects.toThrow("craftTransaction is not supported");
    });
  });

  describe("craftRawTransaction", () => {
    it("should throw unsupported error", () => {
      const api = createApi(mockConfig, "aleo");

      expect(() =>
        api.craftRawTransaction("transaction", "sender", "publicKey", BigInt(1)),
      ).toThrow("craftRawTransaction is not supported");
    });
  });

  describe("estimateFees", () => {
    it("should call estimateFees and return fee estimation", async () => {
      const api = createApi(mockConfig, "aleo");
      const txIntent = createMockTransactionIntent();
      const result = await api.estimateFees(txIntent);

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
      const api = createApi(mockConfig, "aleo");
      const result = await api.getBalance("aleo1test");

      expect(mockedGetBalance).toHaveBeenCalledTimes(1);
      expect(mockedGetBalance).toHaveBeenCalledWith(expect.any(Object), "aleo1test");
      expect(result).toEqual([{ value: BigInt(10), asset: { type: "native" } }]);
    });

    it("should throw an exception when options is provided", async () => {
      const api = createApi(mockConfig, "aleo");
      await expect(api.getBalance("", {} as unknown as BalanceOptions)).rejects.toThrow(
        InvalidParameterError,
      );
    });
  });

  describe("getBlock", () => {
    it("should throw unsupported error", () => {
      const api = createApi(mockConfig, "aleo");

      expect(() => api.getBlock(123)).toThrow("getBlock is not supported");
    });
  });

  describe("getBlockInfo", () => {
    it("should throw unsupported error", () => {
      const api = createApi(mockConfig, "aleo");

      expect(() => api.getBlockInfo(123)).toThrow("getBlockInfo is not supported");
    });
  });

  describe("getRewards", () => {
    it("should throw unsupported error", () => {
      const api = createApi(mockConfig, "aleo");

      expect(() => api.getRewards("aleo1test")).toThrow("getRewards is not supported");
    });
  });

  describe("getNextSequence", () => {
    it("should throw unsupported error", async () => {
      const api = createApi(mockConfig, "aleo");

      await expect(api.getNextSequence("aleo1test")).rejects.toThrow(
        "getNextSequence is not supported",
      );
    });
  });

  describe("getStakes", () => {
    it("should throw unsupported error", () => {
      const api = createApi(mockConfig, "aleo");

      expect(() => api.getStakes("aleo1test")).toThrow("getStakes is not supported");
    });
  });

  describe("getValidators", () => {
    it("should throw unsupported error", () => {
      const api = createApi(mockConfig, "aleo");

      expect(() => api.getValidators()).toThrow("getValidators is not supported");
    });
  });

  describe("lastBlock", () => {
    it("should call lastBlock and return block info", async () => {
      const api = createApi(mockConfig, "aleo");
      const result = await api.lastBlock();

      expect(mockedLastBlock).toHaveBeenCalledTimes(1);
      expect(mockedLastBlock).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toMatchObject({ hash: "blockHash", height: 42 });
    });
  });

  describe("listOperations", () => {
    it("should call listOperations and return operations with proper structure", async () => {
      const api = createApi(mockConfig, "aleo");
      const options = { minHeight: 10, limit: 5 };
      const result = await api.listOperations("aleo1test", options);

      expect(mockedListOperations).toHaveBeenCalledTimes(1);
      expect(mockedListOperations).toHaveBeenCalledWith({
        configOrCurrencyId: expect.objectContaining({ status: { type: "active" } }),
        address: "aleo1test",
        options,
        mode: "alpaca",
      });
      expect(result).toEqual({ items: [mockOperation], next: "next-cursor" });
    });

    it("should return undefined next when listOperations has no next cursor", async () => {
      const api = createApi(mockConfig, "aleo");
      mockedListOperations.mockResolvedValueOnce({
        operations: [mockOperation],
        nextCursor: null,
      });
      const result = await api.listOperations("aleo1test", { minHeight: 1 });

      expect(result).toEqual({ items: [mockOperation], next: undefined });
    });
  });

  describe("validateIntent", () => {
    it("should throw unsupported error", async () => {
      const api = createApi(mockConfig, "aleo");
      const txIntent = createMockTransactionIntent();

      await expect(api.validateIntent(txIntent, [])).rejects.toThrow(
        "validateIntent is not supported",
      );
    });
  });
});
