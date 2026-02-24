import { renderHook, waitFor } from "@testing-library/react-native";
import BigNumber from "bignumber.js";
import { useFeePresetFiatValues } from "../useFeePresetFiatValues";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";

jest.mock("@ledgerhq/live-common/bridge/index");
jest.mock("@ledgerhq/live-countervalues-react");
jest.mock("@ledgerhq/live-common/currencies/index");

const btcUnit: Unit = { name: "Bitcoin", code: "BTC", magnitude: 8 };
const usdUnit: Unit = { name: "US Dollar", code: "USD", magnitude: 2 };

const mockCurrency = {
  id: "bitcoin",
  family: "bitcoin",
  units: [btcUnit],
} as unknown as Currency;

const mockCounterValueCurrency = {
  id: "USD",
  ticker: "USD",
  units: [usdUnit],
} as unknown as Currency;

const mockMainAccount = {
  id: "mock-account",
  currency: mockCurrency,
  balance: new BigNumber(100_000_000),
} as unknown as Account;

const mockAccount = mockMainAccount;

const mockTransaction = {
  family: "bitcoin",
  recipient: "bc1qrecipient",
  amount: new BigNumber(50_000_000),
  useAllAmount: false,
} as unknown as Transaction;

const mockFeePresetOptions = [
  { id: "slow", label: "Slow", amount: new BigNumber(1_000) },
  { id: "medium", label: "Medium", amount: new BigNumber(2_000) },
  { id: "fast", label: "Fast", amount: new BigNumber(3_000) },
];

const mockBridge = {
  updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
  prepareTransaction: jest.fn(async (_, tx) => tx),
  getTransactionStatus: jest.fn(async () => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(1_000),
  })),
};

describe("useFeePresetFiatValues", () => {
  const mockConvertCountervalue = jest.fn();

  const defaultParams = {
    account: mockAccount,
    parentAccount: null,
    mainAccount: mockMainAccount,
    transaction: mockTransaction,
    feePresetOptions: mockFeePresetOptions,
    counterValueCurrency: mockCounterValueCurrency,
    fiatUnit: usdUnit,
    locale: "en",
    enabled: true,
    shouldEstimateWithBridge: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getAccountBridge)
      .mockReturnValue(mockBridge as unknown as ReturnType<typeof getAccountBridge>);
    jest
      .mocked(useCalculateCountervalueCallback)
      .mockReturnValue(
        mockConvertCountervalue as ReturnType<typeof useCalculateCountervalueCallback>,
      );
    jest
      .mocked(formatCurrencyUnit)
      .mockImplementation((_, amount) => `$${amount.dividedBy(100).toFixed(2)}`);
    mockConvertCountervalue.mockImplementation((_currency, amount) =>
      amount.multipliedBy(30_000).dividedBy(100_000_000),
    );
  });

  describe("disabled state", () => {
    it("returns empty map when enabled is false", () => {
      const { result } = renderHook(() =>
        useFeePresetFiatValues({ ...defaultParams, enabled: false }),
      );

      expect(result.current).toEqual({});
    });

    it("returns empty map when feePresetOptions is empty", () => {
      const { result } = renderHook(() =>
        useFeePresetFiatValues({ ...defaultParams, feePresetOptions: [] }),
      );

      expect(result.current).toEqual({});
    });
  });

  describe("direct values path (no bridge)", () => {
    it("returns fiat values from preset amounts when all options have amounts", () => {
      const { result } = renderHook(() => useFeePresetFiatValues(defaultParams));

      expect(result.current).toEqual({
        slow: expect.any(String),
        medium: expect.any(String),
        fast: expect.any(String),
      });
    });

    it("calls formatCurrencyUnit for each preset with its countervalue", () => {
      renderHook(() => useFeePresetFiatValues(defaultParams));

      expect(mockConvertCountervalue).toHaveBeenCalledTimes(3);
      expect(mockConvertCountervalue).toHaveBeenCalledWith(mockCurrency, new BigNumber(1_000));
      expect(mockConvertCountervalue).toHaveBeenCalledWith(mockCurrency, new BigNumber(2_000));
      expect(mockConvertCountervalue).toHaveBeenCalledWith(mockCurrency, new BigNumber(3_000));
    });

    it("returns null for a preset when countervalue is unavailable", () => {
      mockConvertCountervalue.mockReturnValue(null);

      const { result } = renderHook(() => useFeePresetFiatValues(defaultParams));

      // When countervalue is null, formatted value should be null
      Object.values(result.current).forEach(value => {
        expect(value).toBeNull();
      });
    });

    it("does not use direct path when shouldEstimateWithBridge is true", () => {
      const { result } = renderHook(() =>
        useFeePresetFiatValues({ ...defaultParams, shouldEstimateWithBridge: true }),
      );

      // Direct values are skipped → returns empty initially (bridge estimation pending)
      expect(result.current).toEqual({});
    });

    it("does not use direct path when a preset has no amount", () => {
      const presetsWithMissingAmount = [
        { id: "slow", amount: new BigNumber(1_000) },
        { id: "medium", amount: undefined },
        { id: "fast", amount: new BigNumber(3_000) },
      ] as unknown as readonly Readonly<{
        id: string;
        amount: BigNumber;
        estimatedMs?: number | undefined;
        disabled?: boolean | undefined;
      }>[];

      const { result } = renderHook(() =>
        useFeePresetFiatValues({
          ...defaultParams,
          feePresetOptions: presetsWithMissingAmount,
          shouldEstimateWithBridge: false,
        }),
      );

      // Not all presets have amounts → direct path fails → no values initially
      expect(result.current).toEqual({});
    });
  });

  describe("bridge estimation path", () => {
    const presetsWithoutAmounts = [
      { id: "slow", amount: undefined },
      { id: "medium", amount: undefined },
      { id: "fast", amount: undefined },
    ] as unknown as readonly Readonly<{
      id: string;
      amount: BigNumber;
      estimatedMs?: number | undefined;
      disabled?: boolean | undefined;
    }>[];

    it("estimates fiat values via bridge when presets have no amounts", async () => {
      const { result } = renderHook(() =>
        useFeePresetFiatValues({
          ...defaultParams,
          feePresetOptions: presetsWithoutAmounts,
          shouldEstimateWithBridge: false,
        }),
      );

      await waitFor(() => {
        expect(Object.keys(result.current).length).toBeGreaterThan(0);
      });

      expect(result.current).toHaveProperty("slow");
      expect(result.current).toHaveProperty("medium");
      expect(result.current).toHaveProperty("fast");
    });

    it("uses fallbackPresetIds when feePresetOptions is empty", async () => {
      const { result } = renderHook(() =>
        useFeePresetFiatValues({
          ...defaultParams,
          feePresetOptions: [],
          fallbackPresetIds: ["slow", "medium", "fast"],
        }),
      );

      await waitFor(() => {
        expect(Object.keys(result.current).length).toBeGreaterThan(0);
      });
    });

    it("calls bridge prepareTransaction for each preset strategy", async () => {
      renderHook(() =>
        useFeePresetFiatValues({
          ...defaultParams,
          feePresetOptions: presetsWithoutAmounts,
        }),
      );

      await waitFor(() => {
        expect(mockBridge.prepareTransaction).toHaveBeenCalledTimes(3);
      });
    });

    it("calls bridge getTransactionStatus after prepareTransaction", async () => {
      renderHook(() =>
        useFeePresetFiatValues({
          ...defaultParams,
          feePresetOptions: presetsWithoutAmounts,
        }),
      );

      await waitFor(() => {
        expect(mockBridge.getTransactionStatus).toHaveBeenCalledTimes(3);
      });
    });

    it("does not re-estimate when recipient and amount are unchanged", () => {
      const { rerender } = renderHook(
        ({ locale }: { locale: string }) =>
          useFeePresetFiatValues({
            ...defaultParams,
            feePresetOptions: presetsWithoutAmounts,
            locale,
          }),
        { initialProps: { locale: "en" } },
      );

      const callCount = mockBridge.prepareTransaction.mock.calls.length;

      // Locale change doesn't affect the estimation key
      rerender({ locale: "fr" });

      expect(mockBridge.prepareTransaction.mock.calls.length).toBe(callCount);
    });

    it("re-estimates when recipient changes", async () => {
      const { rerender } = renderHook(
        ({ recipient }: { recipient: string }) =>
          useFeePresetFiatValues({
            ...defaultParams,
            feePresetOptions: presetsWithoutAmounts,
            transaction: { ...mockTransaction, recipient } as unknown as Transaction,
          }),
        { initialProps: { recipient: "bc1qrecipient" } },
      );

      await waitFor(() => {
        expect(mockBridge.prepareTransaction).toHaveBeenCalled();
      });

      const callCount = mockBridge.prepareTransaction.mock.calls.length;

      rerender({ recipient: "bc1qnewrecipient" });

      await waitFor(() => {
        expect(mockBridge.prepareTransaction.mock.calls.length).toBeGreaterThan(callCount);
      });
    });

    it("handles bridge errors gracefully without crashing", async () => {
      mockBridge.prepareTransaction.mockRejectedValue(new Error("Bridge error"));

      const { result } = renderHook(() =>
        useFeePresetFiatValues({
          ...defaultParams,
          feePresetOptions: presetsWithoutAmounts,
        }),
      );

      // Should remain empty on bridge failure, not throw
      await waitFor(() => {
        expect(result.current).toEqual({});
      });
    });
  });
});
