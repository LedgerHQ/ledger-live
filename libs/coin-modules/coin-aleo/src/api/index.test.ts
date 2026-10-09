import type { Page, Stake } from "@ledgerhq/coin-module-framework/api/index";
import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import type { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  createMockTransactionIntent,
  mockApiTxIntentFeePrivate,
  mockApiTxIntentTransferPrivate,
  mockApiTxIntentTransferPrivateSelection,
  mockTxIntentFeePrivate,
  mockTxIntentFeePublic,
  mockTxIntentTransferPrivate,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getAccountInfo,
  getBalance,
  getStakes,
  getValidators,
  lastBlock,
  register,
  resolveRecords,
  selectRecords,
} from "../logic";
import {
  buildFeeConfigurationForRootIntent,
  getTransactionType,
  resolvePrivacyContext,
} from "../logic/utils";
import type { AleoContext, AleoTransactionIntent } from "../types";
import { createApi } from "./index";
import { listOperations } from "../logic/listOperations";

jest.mock("../logic");
jest.mock("../logic/utils");
jest.mock("../logic/listOperations");

describe("createApi", () => {
  const api = createApi("aleo");
  // The consumer path: the resolver wraps the module, and the wrapper is what answers for the
  // capabilities Aleo has none of.
  const resolved = withDefaults(createApi("aleo"));
  const mockConfig = getMockedConfig("testnet");
  const context: AleoContext = {
    config: async () => mockConfig,
    logger: () => {},
  };
  const mockedBroadcast = jest.mocked(broadcast);
  const mockedCombine = jest.mocked(combine);
  const mockedCraftTransaction = jest.mocked(craftTransaction);
  const mockedEstimateFees = jest.mocked(estimateFees);
  const mockedGetAccountInfo = jest.mocked(getAccountInfo);
  const mockedListOperations = jest.mocked(listOperations);
  const mockedGetBalance = jest.mocked(getBalance);
  const mockedGetStakes = jest.mocked(getStakes);
  const mockedGetValidators = jest.mocked(getValidators);
  const mockedLastBlock = jest.mocked(lastBlock);
  const mockedRegister = jest.mocked(register);
  const mockedResolveRecords = jest.mocked(resolveRecords);
  const mockedSelectRecords = jest.mocked(selectRecords);
  const mockedGetTransactionType = jest.mocked(getTransactionType);
  const mockedBuildFeeConfigurationForRootIntent = jest.mocked(buildFeeConfigurationForRootIntent);
  const mockedResolvePrivacyContext = jest.mocked(resolvePrivacyContext);

  beforeEach(() => {
    jest.clearAllMocks();

    mockedBroadcast.mockResolvedValue("tx-hash");
    mockedCombine.mockResolvedValue("combined-hex");
    mockedCraftTransaction.mockResolvedValue({ transaction: "crafted_tx" });
    mockedEstimateFees.mockReturnValue({ value: BigInt(1234) });
    mockedGetBalance.mockResolvedValue([{ value: BigInt(10), asset: { type: "native" } }]);
    mockedGetStakes.mockResolvedValue({ items: [] });
    mockedGetValidators.mockResolvedValue([]);
    mockedLastBlock.mockResolvedValue({ hash: "blockHash", height: 42, time: new Date() });
    mockedGetTransactionType.mockReturnValue("transfer_public");
    mockedBuildFeeConfigurationForRootIntent.mockReturnValue({
      function_name: "fee_public",
      max_base_fee: "1234",
      max_priority_fee: "0",
    });
    mockedRegister.mockResolvedValue({ type: "aleo", provableId: "scan-uuid-123" });
    mockedResolvePrivacyContext.mockReturnValue({
      provableId: "uuid1field",
      viewKey: "AViewKey1test",
    });
    mockedResolveRecords.mockImplementation(
      async ({ txIntent }) => txIntent as AleoTransactionIntent,
    );
  });

  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(api, context)).resolves.toEqual({
      unsupported: [
        "call",
        "craftRawTransaction",
        "getBlock",
        "getBlockInfo",
        "getNextSequence",
        "getRewards",
        "validateIntent",
      ],
      inconsistent: [],
    });
  });

  it("declares every method the chain supports", () => {
    expect(api.broadcast).toBeInstanceOf(Function);
    expect(api.combine).toBeInstanceOf(Function);
    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.estimateFees).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
    expect(api.getStakes).toBeInstanceOf(Function);
    expect(api.getValidators).toBeInstanceOf(Function);
    expect(api.lastBlock).toBeInstanceOf(Function);
    expect(api.listOperations).toBeInstanceOf(Function);
    expect(api.craftTransactionData).toBeInstanceOf(Function);
    expect(api.getAccountInfo).toBeInstanceOf(Function);
    expect(api.register).toBeInstanceOf(Function);
    expect(api.validateAddress).toBeInstanceOf(Function);

    // The one capability the report above cannot speak for: its default is the `{ type: 'none' }`
    // sentinel rather than an error, so only `supports()` tells the real implementation from the
    // backfill.
    expect(resolved.supports("getAccountInfo")).toBe(true);
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

      const result = await api.getAccountInfo(enrolledContext, "aleo1test");

      expect(mockedGetAccountInfo).toHaveBeenCalledTimes(1);
      expect(mockedGetAccountInfo).toHaveBeenCalledWith(mockConfig, "scan-uuid-123");
      expect(result).toEqual(accountInfo);
    });

    it("returns { type: 'none' } and makes no scanner call when no provableId is on the context", async () => {
      const result = await api.getAccountInfo(context, "aleo1test");

      expect(result).toEqual({ type: "none" });
      expect(mockedGetAccountInfo).not.toHaveBeenCalled();
    });

    it("returns { type: 'none' } when provableId is present but empty", async () => {
      const emptyContext: AleoContext = { ...context, provableId: "" };

      const result = await api.getAccountInfo(emptyContext, "aleo1test");

      expect(result).toEqual({ type: "none" });
      expect(mockedGetAccountInfo).not.toHaveBeenCalled();
    });
  });

  describe("broadcast", () => {
    it("should resolve config from the context and delegate to logic broadcast", async () => {
      const result = await api.broadcast(context, "signed-tx-hex");

      expect(mockedBroadcast).toHaveBeenCalledTimes(1);
      expect(mockedBroadcast).toHaveBeenCalledWith({
        configOrCurrencyId: mockConfig,
        signedTx: "signed-tx-hex",
      });
      expect(result).toBe("tx-hash");
    });
  });

  describe("combine", () => {
    const contextWithViewKey: AleoContext = { ...context, viewKey: "AViewKey1test" };

    it("resolves config and view key from the context and delegates to logic combine", async () => {
      const result = await api.combine(contextWithViewKey, "crafted-tx", ["root-sig"]);

      expect(mockedCombine).toHaveBeenCalledTimes(1);
      expect(mockedCombine).toHaveBeenCalledWith({
        config: mockConfig,
        transaction: "crafted-tx",
        signatures: ["root-sig"],
        viewKey: "AViewKey1test",
      });
      expect(result).toBe("combined-hex");
    });

    it("throws error and skips combine when the view key is absent", async () => {
      await expect(api.combine(context, "crafted-tx", ["root-sig"])).rejects.toThrow(
        "aleo: a view key is required to combine a transaction",
      );
      expect(mockedCombine).not.toHaveBeenCalled();
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
      ["fee_private", mockApiTxIntentFeePrivate, "mock-view-key"],
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
      ["fee_private", mockApiTxIntentFeePrivate],
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
      ["fee_private", mockApiTxIntentFeePrivate],
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
    ])("throws error for a private root intent when viewKey is %s", async (_label, viewKey) => {
      const privateContext = {
        ...context,
        ...(viewKey !== undefined && { viewKey }),
      } as AleoContext;

      await expect(
        api.craftTransaction(privateContext, mockApiTxIntentTransferPrivate),
      ).rejects.toThrow("aleo: a view key is required to craft a private transaction");

      expect(mockedCraftTransaction).not.toHaveBeenCalled();
      expect(mockedBuildFeeConfigurationForRootIntent).not.toHaveBeenCalled();
    });

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["empty string", ""],
    ])("throws error for a fee_private intent when viewKey is %s", async (_label, viewKey) => {
      const privateFeeContext = {
        ...context,
        config: async () => ({ ...mockConfig, isFeeSponsored: false }),
        ...(viewKey !== undefined && { viewKey }),
      } as AleoContext;

      await expect(
        api.craftTransaction(privateFeeContext, mockApiTxIntentFeePrivate),
      ).rejects.toThrow("aleo: a view key is required to craft a private fee transaction");

      expect(mockedCraftTransaction).not.toHaveBeenCalled();
    });

    describe("record selection", () => {
      const privateContext: AleoContext = { ...context, viewKey: "AViewKey1test" };

      it.each([
        ["sponsored", true, null],
        ["not sponsored", false, 1234n],
      ])(
        "returns the module's selection without crafting when fees are %s",
        async (_label, isFeeSponsored, fee) => {
          const selectionContext: AleoContext = {
            ...privateContext,
            config: async () => ({ ...mockConfig, isFeeSponsored }),
          };
          const selection = {
            recordCommitments: ["record-1-commitment"],
            ...(!isFeeSponsored && { feeRecordCommitment: "record-2-commitment" }),
          };
          mockedSelectRecords.mockResolvedValue(selection);

          const result = await api.craftTransaction(
            selectionContext,
            mockApiTxIntentTransferPrivateSelection,
          );

          expect(mockedSelectRecords).toHaveBeenCalledWith({
            config: { ...mockConfig, isFeeSponsored },
            context: selectionContext,
            txIntent: mockApiTxIntentTransferPrivateSelection,
            fee,
          });
          expect(result).toEqual({ transaction: "", details: selection });
          expect(mockedCraftTransaction).not.toHaveBeenCalled();
          expect(mockedResolveRecords).not.toHaveBeenCalled();
        },
      );

      it("crafts the resolved records and echoes the commitments", async () => {
        mockedResolveRecords.mockResolvedValue(mockTxIntentTransferPrivate);

        const result = await api.craftTransaction(privateContext, mockApiTxIntentTransferPrivate);

        expect(mockedSelectRecords).not.toHaveBeenCalled();
        expect(mockedResolveRecords).toHaveBeenCalledWith({
          config: mockConfig,
          context: privateContext,
          txIntent: mockApiTxIntentTransferPrivate,
        });
        expect(mockedBuildFeeConfigurationForRootIntent).toHaveBeenCalledWith({
          isPrivate: true,
          maxBaseFee: BigInt(1234),
          maxPriorityFee: 0n,
        });
        expect(mockedCraftTransaction).toHaveBeenCalledWith(
          expect.objectContaining({ txIntent: mockTxIntentTransferPrivate }),
        );
        expect(result).toEqual({
          transaction: "crafted_tx",
          details: { recordCommitments: ["record-1-commitment"] },
        });
      });

      it("crafts a fee_private intent with its resolved fee record", async () => {
        const feeContext: AleoContext = {
          ...privateContext,
          config: async () => ({ ...mockConfig, isFeeSponsored: false }),
        };
        mockedResolveRecords.mockResolvedValue(mockTxIntentFeePrivate);

        await api.craftTransaction(feeContext, mockApiTxIntentFeePrivate);

        expect(mockedResolveRecords).toHaveBeenCalledWith(
          expect.objectContaining({ txIntent: mockApiTxIntentFeePrivate }),
        );
        expect(mockedCraftTransaction).toHaveBeenCalledWith(
          expect.objectContaining({ txIntent: mockTxIntentFeePrivate, feeConfiguration: null }),
        );
      });
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

  describe("getStakes", () => {
    it("resolves config and delegates to logic/getStakes", async () => {
      const page: Page<Stake> = {
        items: [
          {
            uid: "aleo1test",
            address: "aleo1test",
            state: "active",
            actions: ["delegate", "undelegate"],
            asset: { type: "native" },
            amount: 10n,
          },
        ],
      };
      mockedGetStakes.mockResolvedValue(page);

      const result = await api.getStakes(context, "aleo1test");

      expect(mockedGetStakes).toHaveBeenCalledTimes(1);
      expect(mockedGetStakes).toHaveBeenCalledWith(mockConfig, "aleo1test");
      expect(result).toBe(page);
    });
  });

  describe("getValidators", () => {
    it("maps the network's committee to the framework Validator shape", async () => {
      mockedGetValidators.mockResolvedValue([
        {
          address: "aleo1validator",
          name: "Some Validator",
          stakeMicrocredits: 40_000_000_000_000,
          isOpen: true,
          isUnbonding: false,
          commissionPercent: 10,
          estimatedYearlyRewardsRate: 0.07,
        },
      ]);

      const result = await api.getValidators(context);

      expect(mockedGetValidators).toHaveBeenCalledTimes(1);
      expect(mockedGetValidators).toHaveBeenCalledWith(mockConfig);
      expect(result).toEqual({
        items: [
          {
            id: "aleo1validator",
            address: "aleo1validator",
            name: "Some Validator",
            balance: 40_000_000_000_000n,
            commissionRate: "10",
            apy: 0.07,
          },
        ],
      });
    });

    it("falls back to the address when the validator has no name, and omits apy when it has none", async () => {
      mockedGetValidators.mockResolvedValue([
        {
          address: "aleo1unnamed",
          stakeMicrocredits: 1,
          isOpen: true,
          isUnbonding: false,
          commissionPercent: 0,
        },
      ]);

      const result = await api.getValidators(context);

      expect(result).toEqual({
        items: [
          {
            id: "aleo1unnamed",
            address: "aleo1unnamed",
            name: "aleo1unnamed",
            balance: 1n,
            commissionRate: "0",
          },
        ],
      });
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
    it.each(["asc", "desc"] as const)("should pass order %s to the logic layer", async order => {
      const api = createApi("aleo");
      mockedListOperations.mockResolvedValue({ items: [], next: undefined });

      await api.listOperations(context, "aleo1test", { minHeight: 0, order });

      expect(mockedListOperations).toHaveBeenCalledWith(
        expect.objectContaining({ options: { minHeight: 0, order } }),
      );
    });

    it("should reject without touching the logic layer when the context carries no private pair", async () => {
      const api = createApi("aleo");
      mockedResolvePrivacyContext.mockImplementation(() => {
        throw new Error("aleo: provableId is missing");
      });

      await expect(api.listOperations(context, "aleo1test", { minHeight: 0 })).rejects.toThrow(
        "aleo: provableId is missing",
      );
      expect(mockedListOperations).not.toHaveBeenCalled();
    });

    it("should delegate to the logic layer with the context private pair", async () => {
      const api = createApi("aleo");
      const page = { items: [], next: undefined };
      mockedListOperations.mockResolvedValue(page);

      const result = await api.listOperations(
        { ...context, provableId: "uuid1field", viewKey: "AViewKey1test" },
        "aleo1test",
        { minHeight: 0 },
      );

      expect(mockedResolvePrivacyContext).toHaveBeenCalledWith(
        expect.objectContaining({ provableId: "uuid1field", viewKey: "AViewKey1test" }),
      );
      expect(mockedListOperations).toHaveBeenCalledTimes(1);
      expect(mockedListOperations).toHaveBeenCalledWith({
        config: mockConfig,
        address: "aleo1test",
        options: { minHeight: 0 },
        provableId: "uuid1field",
        viewKey: "AViewKey1test",
      });
      expect(result).toBe(page);
    });
  });

  describe("register", () => {
    it("reads the view key off the context and delegates to logic register, returning the handle", async () => {
      const enrolledContext: AleoContext = { ...context, viewKey: "AViewKey1mockviewkey" };

      const result = await api.register(enrolledContext, "aleo1test");

      expect(mockedRegister).toHaveBeenCalledTimes(1);
      expect(mockedRegister).toHaveBeenCalledWith(mockConfig, "AViewKey1mockviewkey");
      expect(result).toEqual({ type: "aleo", provableId: "scan-uuid-123" });
    });

    it("rejects before any network call when the context carries no view key", async () => {
      await expect(api.register(context, "aleo1test")).rejects.toThrow(/view key is required/);
      expect(mockedRegister).not.toHaveBeenCalled();
    });

    it("rejects before any network call when the view key is empty", async () => {
      const emptyContext: AleoContext = { ...context, viewKey: "" };

      await expect(api.register(emptyContext, "aleo1test")).rejects.toThrow(/view key is required/);
      expect(mockedRegister).not.toHaveBeenCalled();
    });

    it("keeps the raw view key out of the rejection message", async () => {
      await expect(api.register(context, "aleo1test")).rejects.toThrow(
        expect.objectContaining({ message: expect.not.stringContaining("AViewKey") }),
      );
    });
  });
});
