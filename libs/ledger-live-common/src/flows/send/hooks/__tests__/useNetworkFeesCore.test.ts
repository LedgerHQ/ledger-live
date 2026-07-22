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

  it("calls updateTransaction when selecting a fee strategy", () => {
    const { result } = renderCore();

    act(() => {
      result.current.onSelectFeeStrategy("fast");
    });

    expect(mockUpdateTransaction).toHaveBeenCalled();
    expect(bridgeUpdateTransaction).toHaveBeenCalledWith(mockTransaction, { feesStrategy: "fast" });
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
});
