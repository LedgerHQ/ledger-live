import type {
  TransactionIntent,
  FeeEstimation,
  MemoNotSupported,
} from "@ledgerhq/coin-framework/api/types";
import type { AleoTransactionIntentData } from "../types";
import coinConfig from "../config";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAlpacaOperation } from "../__tests__/fixtures/operation.fixture";
import { craftTransaction, estimateFees, getBalance, lastBlock, listOperations } from "../logic";
import { getTransactionType } from "../logic/utils";
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
    data: { type: "fee_public", priorityFee: 1040, executionId: "ex1test" },
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
    it("should reject when customFees are provided", async () => {
      const api = createApi(mockConfig, "aleo");
      const txIntent = createMockTransactionIntent();
      const customFees: FeeEstimation = { value: BigInt(1000) };

      await expect(api.craftTransaction(txIntent, customFees)).rejects.toThrow(
        "customFees are not supported",
      );
    });

    it("should reject when useAllAmount is true", async () => {
      const api = createApi(mockConfig, "aleo");
      const txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        ...createMockTransactionIntent(),
        useAllAmount: true,
      };

      await expect(api.craftTransaction(txIntent)).rejects.toThrow(
        "useAllAmount is not supported yet",
      );
    });

    it("should call craftTransaction logic when invariants pass", async () => {
      const api = createApi(mockConfig, "aleo");
      const txIntent = createMockTransactionIntent();
      const result = await api.craftTransaction(txIntent);

      expect(mockedCraftTransaction).toHaveBeenCalledTimes(1);
      expect(mockedCraftTransaction).toHaveBeenCalledWith({
        currency: expect.any(Object),
        txIntent,
      });
      expect(result).toEqual({ transaction: "crafted_tx" });
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

  describe("getSequence", () => {
    it("should throw unsupported error", async () => {
      const api = createApi(mockConfig, "aleo");

      await expect(api.getSequence("aleo1test")).rejects.toThrow("getSequence is not supported");
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
        currency: expect.any(Object),
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
