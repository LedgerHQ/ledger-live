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
  isTokenAccount: jest.fn((acc: unknown) => (acc as { type?: string })?.type === "TokenAccount"),
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

  describe("fee-currency decimals rescaling (e.g. Celo CIP-64 with a sub-decimal fee token)", () => {
    const usdcUnit: Unit = { name: "USD Coin", code: "USDC", magnitude: 6 };
    const usdcToken = {
      type: "TokenCurrency",
      id: "celo/erc20/usdc",
      ticker: "USDC",
      units: [usdcUnit],
    } as unknown as import("@ledgerhq/types-cryptoassets").TokenCurrency;
    const usdcSubAccount = {
      type: "TokenAccount",
      id: "usdc-sub-account-id",
      token: usdcToken,
      balance: new BigNumber(0),
    } as unknown as import("@ledgerhq/types-live").TokenAccount;

    const celoAccount = {
      ...mockAccount,
      subAccounts: [usdcSubAccount],
    } as unknown as Account;

    const renderCoreWithFeeCurrency = (overrides?: { status?: Partial<TransactionStatus> }) =>
      renderHook(() =>
        useNetworkFeesCore({
          account: celoAccount,
          parentAccount: null,
          transaction: buildTransaction(),
          status: { ...mockStatus, ...overrides?.status },
          uiConfig: mockUiConfig,
          transactionActions: { updateTransaction: mockUpdateTransaction } as never,
          fiatUnit: usdUnit,
          accountUnit: btcUnit,
          calculateCountervalue: mockCalculateCountervalue,
        }),
      );

    it("rescales an 18-decimal-style estimated fee into the 6-decimal fee-currency unit before display", () => {
      mockedSendFeatures.getFeeCurrencyAccountId.mockReturnValue("usdc-sub-account-id");
      // accountUnit magnitude is 8 (btcUnit) in this suite's fixtures; use a fee value that
      // would be off by the magnitude delta (1e2) if left unscaled, to prove scaling occurred.
      const rawFees = new BigNumber("100000000000"); // 8 -> 6 decimals: shift down by 1e2

      const { result } = renderCoreWithFeeCurrency({ status: { estimatedFees: rawFees } });

      // The value handed to calculateCountervalue/formatCurrencyUnit must already be scaled
      // from accountUnit (magnitude 8) to the fee-currency unit (magnitude 6) — not the raw,
      // unscaled estimatedFees (which would be 1e2 too large).
      const expectedScaled = rawFees.shiftedBy(usdcUnit.magnitude - btcUnit.magnitude);
      expect(mockCalculateCountervalue).toHaveBeenCalledWith(
        usdcToken,
        expect.objectContaining({ toString: expect.any(Function) }),
      );
      const [, calledValue] = mockCalculateCountervalue.mock.calls[0];
      expect(calledValue.toString()).toBe(expectedScaled.toString());

      // calculateCountervalue is mocked as value/100, and formatDisplayFeesValue prefers the
      // fiat-formatted value once a countervalue is available.
      const expectedFiat = expectedScaled.dividedBy(100);
      expect(result.current.displayFeesValue).toBe(`FORMATTED_${expectedFiat.toString()}`);
      expect(result.current.formattedEstimatedFeesFiat).toBe(
        `FORMATTED_${expectedFiat.toString()}`,
      );
    });
  });
});
