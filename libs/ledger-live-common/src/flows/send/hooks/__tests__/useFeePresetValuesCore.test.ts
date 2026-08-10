/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFeePresetValuesCore } from "../useFeePresetValuesCore";
import { getAccountBridge } from "../../../../bridge/impl";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import type { Transaction } from "../../../../coin-modules/transaction-types";
import type { FeePresetOption } from "../../../../bridge/descriptor/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Unit } from "@domain/entity-currency-unit";
import type { Currency } from "@domain/entity-currency";

jest.mock("../../../../bridge/impl");
jest.mock("@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit");

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);

const usdUnit: Unit = { name: "US Dollar", code: "USD", magnitude: 2 };
const btcUnit: Unit = { name: "Bitcoin", code: "BTC", magnitude: 8 };
const flushAsyncEstimation = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const mockCurrency = {
  id: "bitcoin",
  ticker: "BTC",
  type: "CryptoCurrency" as const,
  units: [{ name: "Bitcoin", code: "BTC", magnitude: 8 }],
} as unknown as Currency;

const createMainAccount = (overrides?: Partial<Account>): Account =>
  ({
    type: "Account",
    id: "main",
    name: "Bitcoin",
    currency: mockCurrency,
    balance: new BigNumber(100_000_000),
    spendableBalance: new BigNumber(100_000_000),
    blockHeight: 800000,
    lastSyncDate: new Date(),
    ...overrides,
  }) as unknown as Account;

describe("useFeePresetValuesCore", () => {
  const mockCalculateCountervalue = jest.fn();
  const defaultBridge = {
    updateTransaction: jest.fn((tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
      ...tx,
      ...patch,
    })),
    prepareTransaction: jest.fn(async (_account: unknown, tx: Record<string, unknown>) => tx),
    getTransactionStatus: jest.fn(async () => ({
      errors: {},
      estimatedFees: new BigNumber(1_000),
    })),
  };

  const defaultParams = {
    account: createMainAccount() as AccountLike,
    parentAccount: null,
    mainAccount: createMainAccount(),
    transaction: {
      family: "bitcoin",
      recipient: "bc1qrecipient",
      amount: new BigNumber(50_000_000),
      useAllAmount: false,
    } as Transaction,
    feePresetOptions: [
      { id: "slow", amount: new BigNumber(1_000) },
      { id: "medium", amount: new BigNumber(2_000) },
      { id: "fast", amount: new BigNumber(3_000) },
    ] satisfies readonly FeePresetOption[],
    fiatUnit: usdUnit,
    displayUnit: btcUnit,
    enabled: true,
    shouldEstimateWithBridge: false,
    allowZeroAmountEstimation: false,
    calculateCountervalue: mockCalculateCountervalue,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountBridge.mockResolvedValue(defaultBridge as never);
    mockCalculateCountervalue.mockImplementation((_currency, value) => value);
    // Tag the unit so the assertions can tell the fiat side from the native side.
    mockedFormatCurrencyUnit.mockImplementation(
      (unit, value) => `${unit.code}_${value.toString()}`,
    );
  });

  it("returns direct fiat and native values when preset amounts are available", () => {
    const feePresetOptions = [
      { id: "slow", amount: new BigNumber(1) },
      { id: "fast", amount: new BigNumber(3) },
    ] satisfies readonly FeePresetOption[];

    const { result } = renderHook(() =>
      useFeePresetValuesCore({
        ...defaultParams,
        feePresetOptions,
      }),
    );

    expect(result.current).toEqual({
      slow: { fiat: "USD_1", crypto: "BTC_1" },
      fast: { fiat: "USD_3", crypto: "BTC_3" },
    });
  });

  it("returns empty map when enabled is false", () => {
    const { result } = renderHook(() =>
      useFeePresetValuesCore({ ...defaultParams, enabled: false }),
    );

    expect(result.current).toEqual({});
  });

  it("returns empty map when feePresetOptions is empty and no fallback ids", () => {
    const { result } = renderHook(() =>
      useFeePresetValuesCore({ ...defaultParams, feePresetOptions: [] }),
    );

    expect(result.current).toEqual({});
  });

  it("returns a null fiat side, but keeps the native amount, when countervalue is unavailable", () => {
    mockCalculateCountervalue.mockReturnValue(null);

    const { result } = renderHook(() => useFeePresetValuesCore(defaultParams));

    expect(result.current).toEqual({
      slow: { fiat: null, crypto: "BTC_1000" },
      medium: { fiat: null, crypto: "BTC_2000" },
      fast: { fiat: null, crypto: "BTC_3000" },
    });
  });

  it("does not use direct path when shouldEstimateWithBridge is true", () => {
    const { result } = renderHook(() =>
      useFeePresetValuesCore({
        ...defaultParams,
        shouldEstimateWithBridge: true,
      }),
    );

    expect(result.current).toEqual({});
  });

  it("passes locale to formatCurrencyUnit", () => {
    renderHook(() => useFeePresetValuesCore({ ...defaultParams, locale: "fr" }));

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
      usdUnit,
      expect.any(BigNumber),
      expect.objectContaining({ locale: "fr" }),
    );
  });

  it("estimates preset fiat values via bridge when using fallback preset ids (EVM)", async () => {
    const bridge = {
      updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
        ...tx,
        ...patch,
      }),
      prepareTransaction: async (_account: unknown, tx: Record<string, unknown>) => tx,
      getTransactionStatus: async (_account: unknown, tx: Record<string, unknown>) => {
        const feesByStrategy: Record<string, BigNumber> = {
          slow: new BigNumber(1),
          medium: new BigNumber(2),
          fast: new BigNumber(3),
        };
        const strategy = typeof tx.feesStrategy === "string" ? tx.feesStrategy : "";
        return {
          estimatedFees: feesByStrategy[strategy] ?? new BigNumber(0),
          errors: {},
        };
      },
    };
    mockedGetAccountBridge.mockResolvedValue(bridge as never);

    const { result } = renderHook(() =>
      useFeePresetValuesCore({
        ...defaultParams,
        feePresetOptions: [],
        fallbackPresetIds: ["slow", "medium", "fast"],
        transaction: {
          family: "evm",
          recipient: "0xrecipient",
          amount: new BigNumber(0),
          useAllAmount: false,
        } as Transaction,
        shouldEstimateWithBridge: true,
        allowZeroAmountEstimation: true,
      }),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        slow: { fiat: "USD_1", crypto: "BTC_1" },
        medium: { fiat: "USD_2", crypto: "BTC_2" },
        fast: { fiat: "USD_3", crypto: "BTC_3" },
      });
    });
  });

  it("clears custom fee overrides when estimating preset fiat values via bridge", async () => {
    const bridge = {
      updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
        ...tx,
        ...patch,
      }),
      prepareTransaction: async (_account: unknown, tx: Record<string, unknown>) => tx,
      getTransactionStatus: async (_account: unknown, tx: Record<string, unknown>) => {
        const strategy = typeof tx.feesStrategy === "string" ? tx.feesStrategy : "";
        const hasCustomOverrides =
          tx.customGasLimit !== undefined ||
          tx.gasPrice !== undefined ||
          tx.maxFeePerGas !== undefined ||
          tx.maxPriorityFeePerGas !== undefined ||
          tx.feePerByte !== undefined ||
          tx.customFeeRate !== undefined ||
          tx.fees !== undefined ||
          tx.customFees !== undefined;

        if (hasCustomOverrides) {
          return { estimatedFees: new BigNumber(80), errors: {} };
        }

        const feesByStrategy: Record<string, BigNumber> = {
          slow: new BigNumber(1),
          medium: new BigNumber(2),
          fast: new BigNumber(3),
        };
        return {
          estimatedFees: feesByStrategy[strategy] ?? new BigNumber(0),
          errors: {},
        };
      },
    };
    mockedGetAccountBridge.mockResolvedValue(bridge as never);

    const { result } = renderHook(() =>
      useFeePresetValuesCore({
        ...defaultParams,
        feePresetOptions: [],
        fallbackPresetIds: ["slow", "medium", "fast"],
        transaction: {
          family: "evm",
          recipient: "0xrecipient",
          amount: new BigNumber(0),
          useAllAmount: false,
          feesStrategy: "custom",
          customGasLimit: new BigNumber(5_000_000),
          maxFeePerGas: new BigNumber(100_000_000_000),
          maxPriorityFeePerGas: new BigNumber(50_000_000_000),
          customFeeRate: new BigNumber(42),
          feePerByte: new BigNumber(99),
          fees: new BigNumber(123),
          customFees: { example: "value" },
        } as unknown as Transaction,
        shouldEstimateWithBridge: true,
        allowZeroAmountEstimation: true,
      }),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        slow: { fiat: "USD_1", crypto: "BTC_1" },
        medium: { fiat: "USD_2", crypto: "BTC_2" },
        fast: { fiat: "USD_3", crypto: "BTC_3" },
      });
    });
  });

  it("allows retrying the same estimation key after bridge resolution fails", async () => {
    mockedGetAccountBridge.mockRejectedValueOnce(new Error("Bridge error"));

    const { result, rerender } = renderHook(() =>
      useFeePresetValuesCore({
        ...defaultParams,
        shouldEstimateWithBridge: true,
      }),
    );

    await waitFor(() => {
      expect(mockedGetAccountBridge).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await flushAsyncEstimation();
      rerender();
      await flushAsyncEstimation();
    });

    await waitFor(() => {
      expect(mockedGetAccountBridge).toHaveBeenCalledTimes(2);
      expect(result.current).toEqual({
        slow: { fiat: "USD_1000", crypto: "BTC_1000" },
        medium: { fiat: "USD_1000", crypto: "BTC_1000" },
        fast: { fiat: "USD_1000", crypto: "BTC_1000" },
      });
    });
  });

  it("re-estimates when recipient changes", async () => {
    const bridge = {
      updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
        ...tx,
        ...patch,
      }),
      prepareTransaction: jest.fn(async (_account: unknown, tx: Record<string, unknown>) => tx),
      getTransactionStatus: jest.fn(async () => ({
        errors: {},
        estimatedFees: new BigNumber(1_000),
      })),
    };
    mockedGetAccountBridge.mockResolvedValue(bridge as never);

    const presetsWithoutAmounts = [
      { id: "slow", amount: new BigNumber(0) },
      { id: "medium", amount: new BigNumber(0) },
      { id: "fast", amount: new BigNumber(0) },
    ] satisfies readonly FeePresetOption[];

    const { rerender } = renderHook(
      ({ recipient }: { recipient: string }) =>
        useFeePresetValuesCore({
          ...defaultParams,
          feePresetOptions: presetsWithoutAmounts,
          transaction: {
            ...defaultParams.transaction,
            recipient,
          } as Transaction,
          shouldEstimateWithBridge: true,
        }),
      { initialProps: { recipient: "bc1qrecipient" } },
    );

    await waitFor(() => {
      expect(bridge.prepareTransaction).toHaveBeenCalled();
    });

    const callCount = bridge.prepareTransaction.mock.calls.length;

    rerender({ recipient: "bc1qnewrecipient" });

    await waitFor(() => {
      expect(bridge.prepareTransaction.mock.calls.length).toBeGreaterThan(callCount);
    });
  });
});
