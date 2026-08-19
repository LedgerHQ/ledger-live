import type { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedCoinFrameworkOperation } from "../__tests__/fixtures/operation.fixture";
import {
  createMockTransactionIntent,
  mockTxIntentFeePrivate,
  mockTxIntentFeePublic,
  mockTxIntentTransferPrivate,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";
import {
  craftTransaction,
  estimateFees,
  getAccountInfo,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";
import { buildFeeConfigurationForRootIntent, getTransactionType } from "../logic/utils";
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
  const mockedGetBalance = jest.mocked(getBalance);
  const mockedLastBlock = jest.mocked(lastBlock);
  const mockedListOperations = jest.mocked(listOperations);
  const mockedGetTransactionType = jest.mocked(getTransactionType);
  const mockedBuildFeeConfigurationForRootIntent = jest.mocked(buildFeeConfigurationForRootIntent);

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
    mockedBuildFeeConfigurationForRootIntent.mockReturnValue({
      function_name: "fee_public",
      max_base_fee: "1234",
      max_priority_fee: "0",
    });
  });

  it("should return an API object with coin module api methods", () => {
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
    it("throws for an intent with useAllAmount set, before resolving config or crafting", async () => {
      await expect(
        api.craftTransaction(context, { ...mockTxIntentTransferPublic, useAllAmount: true }),
      ).rejects.toThrow("useAllAmount is not supported");

      expect(mockedCraftTransaction).not.toHaveBeenCalled();
      expect(mockedBuildFeeConfigurationForRootIntent).not.toHaveBeenCalled();
    });

    it("omits viewKey from the craft call when a fee intent's context.viewKey is null", async () => {
      const nullViewKeyContext = {
        ...context,
        config: async () => ({ ...mockConfig, isFeeSponsored: false }),
        viewKey: null,
      } as unknown as AleoContext;

      await api.craftTransaction(nullViewKeyContext, mockTxIntentFeePublic);

      expect(mockedCraftTransaction).toHaveBeenCalledWith({
        config: { ...mockConfig, isFeeSponsored: false },
        txIntent: mockTxIntentFeePublic,
        feeConfiguration: null,
      });
    });

    it("delegates a public root intent to logic/craftTransaction with a built FeeConfiguration", async () => {
      const result = await api.craftTransaction(context, mockTxIntentTransferPublic);

      expect(mockedGetTransactionType).toHaveBeenCalledWith(mockTxIntentTransferPublic);
      expect(mockedEstimateFees).toHaveBeenCalledWith({
        configOrCurrencyId: mockConfig,
        transactionType: "transfer_public",
      });
      expect(mockedBuildFeeConfigurationForRootIntent).toHaveBeenCalledWith({
        isPrivate: false,
        maxBaseFee: BigInt(1234),
        maxPriorityFee: 0n,
      });
      expect(mockedCraftTransaction).toHaveBeenCalledWith({
        config: mockConfig,
        txIntent: mockTxIntentTransferPublic,
        feeConfiguration: {
          function_name: "fee_public",
          max_base_fee: "1234",
          max_priority_fee: "0",
        },
      });
      expect(result).toEqual({ transaction: "crafted_tx" });
    });

    it("uses options.customFees for max_base_fee instead of calling estimateFees", async () => {
      await api.craftTransaction(context, mockTxIntentTransferPublic, {
        customFees: { value: 9999n },
      });

      expect(mockedEstimateFees).not.toHaveBeenCalled();
      expect(mockedBuildFeeConfigurationForRootIntent).toHaveBeenCalledWith({
        isPrivate: false,
        maxBaseFee: 9999n,
        maxPriorityFee: 0n,
      });
    });

    it.each([
      ["fee_public", mockTxIntentFeePublic, undefined],
      ["fee_private", mockTxIntentFeePrivate, "mock-view-key"],
    ])(
      "delegates a %s intent to logic/craftTransaction with feeConfiguration: null, without building one or fetching records",
      async (_label, feeIntent, viewKey) => {
        const sponsorshipDisabledContext: AleoContext = {
          ...context,
          config: async () => ({ ...mockConfig, isFeeSponsored: false }),
          ...(viewKey !== undefined && { viewKey }),
        };

        const result = await api.craftTransaction(sponsorshipDisabledContext, feeIntent);

        expect(mockedCraftTransaction).toHaveBeenCalledWith({
          config: { ...mockConfig, isFeeSponsored: false },
          txIntent: feeIntent,
          feeConfiguration: null,
          ...(viewKey !== undefined && { viewKey }),
        });
        expect(mockedBuildFeeConfigurationForRootIntent).not.toHaveBeenCalled();
        expect(mockedEstimateFees).not.toHaveBeenCalled();
        expect(mockedGetBalance).not.toHaveBeenCalled();
        expect(result).toEqual({ transaction: "crafted_tx" });
      },
    );

    it.each([
      ["fee_public", mockTxIntentFeePublic],
      ["fee_private", mockTxIntentFeePrivate],
    ])(
      "throws for a %s intent when fees are sponsored, before any craft",
      async (_label, feeIntent) => {
        await expect(api.craftTransaction(context, feeIntent)).rejects.toThrow(
          "fee craft is not needed when fees are sponsored",
        );

        expect(mockedCraftTransaction).not.toHaveBeenCalled();
        expect(mockedBuildFeeConfigurationForRootIntent).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["fee_public", mockTxIntentFeePublic],
      ["fee_private", mockTxIntentFeePrivate],
    ])("throws for a %s intent when customFees is passed", async (_label, feeIntent) => {
      const sponsorshipDisabledContext: AleoContext = {
        ...context,
        config: async () => ({ ...mockConfig, isFeeSponsored: false }),
      };

      await expect(
        api.craftTransaction(sponsorshipDisabledContext, feeIntent, {
          customFees: { value: 9999n },
        }),
      ).rejects.toThrow("customFees is not supported for fee intents");

      expect(mockedCraftTransaction).not.toHaveBeenCalled();
    });

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["empty string", ""],
    ])(
      "throws AleoIncompletePrivacyContextError for a private root intent when viewKey is %s",
      async (_label, viewKey) => {
        const privateContext = {
          ...context,
          ...(viewKey !== undefined && { viewKey }),
        } as AleoContext;

        await expect(
          api.craftTransaction(privateContext, mockTxIntentTransferPrivate),
        ).rejects.toThrow("aleo: viewKey is missing");

        expect(mockedCraftTransaction).not.toHaveBeenCalled();
        expect(mockedBuildFeeConfigurationForRootIntent).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["empty string", ""],
    ])(
      "throws AleoIncompletePrivacyContextError for a fee_private intent when viewKey is %s",
      async (_label, viewKey) => {
        const privateFeeContext = {
          ...context,
          config: async () => ({ ...mockConfig, isFeeSponsored: false }),
          ...(viewKey !== undefined && { viewKey }),
        } as AleoContext;

        await expect(
          api.craftTransaction(privateFeeContext, mockTxIntentFeePrivate),
        ).rejects.toThrow("aleo: viewKey is missing");

        expect(mockedCraftTransaction).not.toHaveBeenCalled();
      },
    );
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

  describe("getBalance", () => {
    it("should call getBalance and return balances", async () => {
      const result = await api.getBalance(context, "aleo1test");

      expect(mockedGetBalance).toHaveBeenCalledTimes(1);
      expect(mockedGetBalance).toHaveBeenCalledWith(expect.any(Object), "aleo1test");
      expect(result).toEqual([{ value: BigInt(10), asset: { type: "native" } }]);
    });

    it("should throw an exception when options is provided", async () => {
      await expect(
        api.getBalance(context, "", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({
        name: "InvalidParameterError",
      });
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
