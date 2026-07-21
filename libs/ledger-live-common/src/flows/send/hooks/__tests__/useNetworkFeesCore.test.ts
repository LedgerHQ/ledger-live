/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act, renderHook } from "@testing-library/react";
import { useNetworkFeesCore } from "../useNetworkFeesCore";
import { sendFeatures } from "../../../../bridge/descriptor/send/features";
import { useAccountBridge } from "../../../../bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import type { Transaction, TransactionStatus } from "../../../../coin-modules/transaction-types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { SendFlowUiConfig } from "../../types";

jest.mock("../../../../bridge/descriptor/send/features");
jest.mock("../../../../bridge/useAccountBridge");
jest.mock("@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit");
jest.mock("../useFeePresetFiatValuesCore", () => ({
  useFeePresetFiatValuesCore: jest.fn(() => ({
    slow: "$1.00",
    medium: "$2.00",
    fast: "$3.00",
  })),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  getMainAccount: jest.fn((acc: AccountLike) => acc),
  getAccountCurrency: jest.fn((acc: Account) => acc.currency),
}));

const mockedSendFeatures = jest.mocked(sendFeatures);
const mockedUseAccountBridge = jest.mocked(useAccountBridge);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);
const mockedUseFeePresetFiatValuesCore = jest.requireMock(
  "../useFeePresetFiatValuesCore",
).useFeePresetFiatValuesCore;

const btcUnit: Unit = { name: "Bitcoin", code: "BTC", magnitude: 8 };
const usdUnit: Unit = { name: "US Dollar", code: "USD", magnitude: 2 };

const mockCurrency = {
  id: "bitcoin",
  family: "bitcoin",
  ticker: "BTC",
  units: [btcUnit],
} as unknown as import("@ledgerhq/types-cryptoassets").Currency;

const mockAccount = {
  type: "Account",
  id: "mock-account",
  currency: mockCurrency,
  balance: new BigNumber(100_000_000),
  subAccounts: [],
} as unknown as Account;

const mockTransaction = {
  family: "bitcoin",
  recipient: "bc1qrecipient",
  amount: new BigNumber(50_000_000),
  useAllAmount: false,
} as unknown as Transaction;

const buildTransaction = (overrides?: Partial<Transaction>): Transaction =>
  ({ ...mockTransaction, ...overrides }) as Transaction;

const mockStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(1_000),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
} as TransactionStatus;

const mockUiConfig: SendFlowUiConfig = {
  hasMemo: false,
  recipientSupportsDomain: false,
  hasFeePresets: true,
  hasCustomFees: false,
  hasCoinControl: false,
  hasDefaultStrategy: false,
};

describe("useNetworkFeesCore", () => {
  const mockCalculateCountervalue = jest.fn();
  const mockUpdateTransaction = jest.fn();
  const bridgeUpdateTransaction = jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
    ...tx,
    ...patch,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAccountBridge.mockReturnValue({
      updateTransaction: bridgeUpdateTransaction,
    } as never);
    mockedSendFeatures.getFeePresetOptions.mockReturnValue([
      { id: "slow", amount: new BigNumber(1_000) },
      { id: "medium", amount: new BigNumber(2_000) },
      { id: "fast", amount: new BigNumber(3_000) },
    ]);
    mockedSendFeatures.hasFeePresets.mockReturnValue(true);
    mockedSendFeatures.shouldEstimateFeePresetsWithBridge.mockReturnValue(false);
    mockedSendFeatures.getFeePresetFallbackIds.mockReturnValue([]);
    mockedSendFeatures.canEstimateFeePresetsWithZeroAmount.mockReturnValue(false);
    mockedSendFeatures.getFeeCurrencyAccountId.mockReturnValue(null);
    mockedSendFeatures.getDefaultStrategyPatch.mockReturnValue({
      feesStrategy: undefined,
      fees: undefined,
    });
    mockCalculateCountervalue.mockImplementation((_currency, value) => value.dividedBy(100));
    mockedFormatCurrencyUnit.mockImplementation((_unit, value) => `FORMATTED_${value.toString()}`);
    mockUpdateTransaction.mockImplementation((fn: (tx: Transaction) => Transaction) =>
      fn(mockTransaction),
    );
  });

  const renderCore = (overrides?: {
    transaction?: Partial<Transaction>;
    status?: Partial<TransactionStatus>;
    uiConfig?: Partial<SendFlowUiConfig>;
  }) =>
    renderHook(() =>
      useNetworkFeesCore({
        account: mockAccount,
        parentAccount: null,
        transaction: buildTransaction(overrides?.transaction),
        status: { ...mockStatus, ...overrides?.status },
        uiConfig: { ...mockUiConfig, ...overrides?.uiConfig },
        transactionActions: { updateTransaction: mockUpdateTransaction } as never,
        fiatUnit: usdUnit,
        accountUnit: btcUnit,
        calculateCountervalue: mockCalculateCountervalue,
      }),
    );

  it("returns selected preset fiat value when a non-custom strategy is selected", () => {
    const { result } = renderCore({ transaction: { feesStrategy: "medium" } });

    expect(result.current.selectedFeeStrategy).toBe("medium");
    expect(result.current.selectedPresetFiatValue).toBe("$2.00");
  });

  it("returns null selectedPresetFiatValue for custom strategy", () => {
    const { result } = renderCore({ transaction: { feesStrategy: "custom" } });

    expect(result.current.selectedPresetFiatValue).toBeNull();
  });

  it("formats estimated fees for display", () => {
    const { result } = renderCore();

    expect(result.current.displayFeesValue).toBe("FORMATTED_10");
    expect(result.current.formattedEstimatedFeesFiat).toBe("FORMATTED_10");
  });

  it("returns '-' when estimated fees are zero", () => {
    const { result } = renderCore({ status: { estimatedFees: new BigNumber(0) } });

    expect(result.current.displayFeesValue).toBe("-");
  });

  it("shows fiat • crypto (incl. a zero fee) when the coin opts into showFeeCurrencyAmount", () => {
    mockedSendFeatures.showFeeCurrencyAmount.mockReturnValue(true);

    const { result: nonZero } = renderCore();
    expect(nonZero.current.showFeeCurrencyAmount).toBe(true);
    expect(nonZero.current.displayFeesValue).toBe("FORMATTED_10 • FORMATTED_1000");

    const { result: zero } = renderCore({ status: { estimatedFees: new BigNumber(0) } });
    expect(zero.current.displayFeesValue).toBe("FORMATTED_0 • FORMATTED_0");
  });

  it("falls back to the default display for a zero fee while the transaction has errors", () => {
    mockedSendFeatures.showFeeCurrencyAmount.mockReturnValue(true);

    const { result } = renderCore({
      status: { estimatedFees: new BigNumber(0), errors: { recipient: new Error("bad") } },
    });

    expect(result.current.displayFeesValue).toBe("-");
  });

  it("still shows the combined value for a known (non-zero) fee despite a transaction error", () => {
    mockedSendFeatures.showFeeCurrencyAmount.mockReturnValue(true);

    const { result } = renderCore({
      status: { estimatedFees: new BigNumber(1_000), errors: { amount: new Error("too much") } },
    });

    expect(result.current.displayFeesValue).toBe("FORMATTED_10 • FORMATTED_1000");
  });

  it("falls back to the default display for a non-finite estimate", () => {
    mockedSendFeatures.showFeeCurrencyAmount.mockReturnValue(true);

    const { result } = renderCore({ status: { estimatedFees: new BigNumber(NaN) } });

    expect(result.current.displayFeesValue).toBe("-");
  });

  it("calls updateTransaction when selecting a preset fee strategy id", () => {
    const { result } = renderCore();

    act(() => {
      result.current.onSelectFeeStrategyId("fast");
    });

    expect(mockUpdateTransaction).toHaveBeenCalled();
    expect(bridgeUpdateTransaction).toHaveBeenCalledWith(mockTransaction, { feesStrategy: "fast" });
  });

  it("calls updateTransaction with the descriptor's default-strategy patch when selecting the default id", () => {
    mockedSendFeatures.getDefaultStrategyPatch.mockReturnValue({
      feesStrategy: undefined,
      fees: undefined,
    });

    const { result } = renderCore({
      uiConfig: { hasFeePresets: false, hasCustomFees: true, hasDefaultStrategy: true },
      transaction: { feesStrategy: "custom" },
    });

    act(() => {
      result.current.onSelectFeeStrategyId("default");
    });

    expect(mockUpdateTransaction).toHaveBeenCalled();
    expect(mockedSendFeatures.getDefaultStrategyPatch).toHaveBeenCalledWith(mockCurrency);
    expect(bridgeUpdateTransaction).toHaveBeenCalledWith(mockTransaction, {
      feesStrategy: undefined,
      fees: undefined,
    });
  });

  it("falls back to a no-op patch when the descriptor returns no default-strategy patch", () => {
    mockedSendFeatures.getDefaultStrategyPatch.mockReturnValue(null);

    const { result } = renderCore({
      uiConfig: { hasFeePresets: false, hasCustomFees: true, hasDefaultStrategy: true },
      transaction: { feesStrategy: "custom" },
    });

    act(() => {
      result.current.onSelectFeeStrategyId("default");
    });

    expect(mockUpdateTransaction).toHaveBeenCalled();
    expect(bridgeUpdateTransaction).toHaveBeenCalledWith(mockTransaction, {});
  });

  it("passes fallback preset ids to fee preset estimation when options are empty", () => {
    mockedSendFeatures.getFeePresetOptions.mockReturnValue([]);
    mockedSendFeatures.getFeePresetFallbackIds.mockReturnValue(["slow", "medium", "fast"]);
    mockedSendFeatures.shouldEstimateFeePresetsWithBridge.mockReturnValue(true);

    renderCore();

    expect(mockedUseFeePresetFiatValuesCore).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackPresetIds: ["slow", "medium", "fast"],
        shouldEstimateWithBridge: true,
      }),
    );
  });

  it("disables preset fiat values when presets are hidden by ui config", () => {
    renderCore({ uiConfig: { hasFeePresets: false } });

    expect(mockedUseFeePresetFiatValuesCore).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  describe("hasCustomFees / hasCoinControl mirror uiConfig", () => {
    it("mirrors true values", () => {
      const { result } = renderCore({ uiConfig: { hasCustomFees: true, hasCoinControl: true } });

      expect(result.current.hasCustomFees).toBe(true);
      expect(result.current.hasCoinControl).toBe(true);
    });

    it("mirrors false values", () => {
      const { result } = renderCore({ uiConfig: { hasCustomFees: false, hasCoinControl: false } });

      expect(result.current.hasCustomFees).toBe(false);
      expect(result.current.hasCoinControl).toBe(false);
    });
  });

  describe("feeStrategyOptions", () => {
    it("builds preset options preserving order with fiat + legend sublabels", () => {
      const { result } = renderCore({ uiConfig: { hasFeePresets: true } });

      expect(result.current.feeStrategyOptions.map(o => o.id)).toEqual(["slow", "medium", "fast"]);
      expect(result.current.feeStrategyOptions.every(o => o.kind === "preset")).toBe(true);
      expect(result.current.feeStrategyOptions[1].sublabelFiat).toBe("$2.00");
    });

    it("falls back to fallbackPresetIds when feePresetOptions is empty", () => {
      mockedSendFeatures.getFeePresetOptions.mockReturnValue([]);
      mockedSendFeatures.getFeePresetFallbackIds.mockReturnValue(["slow", "medium", "fast"]);
      mockedSendFeatures.shouldEstimateFeePresetsWithBridge.mockReturnValue(true);

      const { result } = renderCore({ uiConfig: { hasFeePresets: true } });

      expect(result.current.feeStrategyOptions.map(o => o.id)).toEqual(["slow", "medium", "fast"]);
    });

    it("builds a single default option when the descriptor declares hasDefaultStrategy", () => {
      const { result } = renderCore({
        uiConfig: { hasFeePresets: false, hasCustomFees: true, hasDefaultStrategy: true },
      });

      expect(result.current.feeStrategyOptions).toEqual([
        { id: "default", kind: "default", sublabelFiat: null, sublabelLegend: null },
      ]);
    });

    it("is empty when there are no presets and the descriptor has no default strategy", () => {
      const { result } = renderCore({
        uiConfig: { hasFeePresets: false, hasCustomFees: false, hasDefaultStrategy: false },
      });

      expect(result.current.feeStrategyOptions).toEqual([]);
    });

    it("is empty when custom fees exist but the descriptor has no default strategy", () => {
      const { result } = renderCore({
        uiConfig: { hasFeePresets: false, hasCustomFees: true, hasDefaultStrategy: false },
      });

      expect(result.current.feeStrategyOptions).toEqual([]);
    });

    it("never includes custom or coinControl entries", () => {
      const { result } = renderCore({
        uiConfig: { hasFeePresets: true, hasCustomFees: true, hasCoinControl: true },
      });

      expect(result.current.feeStrategyOptions.some(o => (o.kind as string) === "custom")).toBe(
        false,
      );
      expect(
        result.current.feeStrategyOptions.some(o => (o.kind as string) === "coinControl"),
      ).toBe(false);
    });
  });

  describe("state matrix: (hasFeePresets, hasCustomFees, hasCoinControl, hasDefaultStrategy) x feesStrategy", () => {
    const boolCombos: ReadonlyArray<{
      hasFeePresets: boolean;
      hasCustomFees: boolean;
      hasDefaultStrategy: boolean;
    }> = [
      { hasFeePresets: true, hasCustomFees: true, hasDefaultStrategy: false },
      { hasFeePresets: true, hasCustomFees: false, hasDefaultStrategy: false },
      { hasFeePresets: false, hasCustomFees: true, hasDefaultStrategy: true },
      { hasFeePresets: false, hasCustomFees: true, hasDefaultStrategy: false },
      { hasFeePresets: false, hasCustomFees: false, hasDefaultStrategy: true },
      { hasFeePresets: false, hasCustomFees: false, hasDefaultStrategy: false },
    ];
    const coinControlCombos = [true, false];
    const feesStrategies: ReadonlyArray<"medium" | "custom" | undefined> = [
      "medium",
      "custom",
      undefined,
    ];

    for (const { hasFeePresets, hasCustomFees, hasDefaultStrategy } of boolCombos) {
      for (const hasCoinControl of coinControlCombos) {
        for (const feesStrategy of feesStrategies) {
          const label = `hasFeePresets=${hasFeePresets} hasCustomFees=${hasCustomFees} hasCoinControl=${hasCoinControl} hasDefaultStrategy=${hasDefaultStrategy} feesStrategy=${feesStrategy ?? "undefined"}`;

          it(`[${label}] satisfies the selection + presence invariants`, () => {
            const { result } = renderCore({
              uiConfig: { hasFeePresets, hasCustomFees, hasCoinControl, hasDefaultStrategy },
              transaction: { feesStrategy },
            });

            const { feeStrategyOptions, selectedFeeStrategyId } = result.current;
            const achievableIds = feeStrategyOptions.map(o => o.id);

            // Exactly-one-or-zero-selected invariant.
            const isEmpty = selectedFeeStrategyId === "";
            const isAchievablePreset = achievableIds.includes(selectedFeeStrategyId);
            const isAchievableCustom = selectedFeeStrategyId === "custom" && hasCustomFees;
            expect(isEmpty || isAchievablePreset || isAchievableCustom).toBe(true);

            // default option present iff hasDefaultStrategy AND there are no presets — the preset and
            // default-strategy paths are mutually exclusive in feeStrategyOptions.
            const hasDefaultOption = feeStrategyOptions.some(o => o.kind === "default");
            expect(hasDefaultOption).toBe(hasDefaultStrategy && !hasFeePresets);

            // preset options present iff hasFeePresets (given ≥1 preset/fallback is always mocked).
            const hasPresetOption = feeStrategyOptions.some(o => o.kind === "preset");
            expect(hasPresetOption).toBe(hasFeePresets);

            // hasCustomFees / hasCoinControl mirror uiConfig.
            expect(result.current.hasCustomFees).toBe(hasCustomFees);
            expect(result.current.hasCoinControl).toBe(hasCoinControl);
          });
        }
      }
    }
  });
});
