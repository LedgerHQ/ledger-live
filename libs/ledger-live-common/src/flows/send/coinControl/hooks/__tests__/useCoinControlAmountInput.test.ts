/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act, renderHook } from "@testing-library/react";
import { useCoinControlAmountInput } from "../useCoinControlAmountInput";
import type { Transaction, TransactionStatus } from "../../../../../coin-modules/transaction-types";
import { bitcoinPickingStrategy } from "../../../../../families/bitcoin/types";

const formatAmountForInput = jest.fn();
const processRawInput = jest.fn();

jest.mock("../../../amount/utils/amountInput", () => ({
  formatAmountForInput: (...args: unknown[]) => formatAmountForInput(...args),
  processRawInput: (...args: unknown[]) => processRawInput(...args),
}));

const mockUnit = { magnitude: 8, code: "BTC", name: "Bitcoin" };

function createBitcoinTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: {
      strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
      excludeUTXOs: [],
    },
    ...overrides,
  } as Transaction;
}

function createTransactionStatus(overrides?: Partial<TransactionStatus>): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
    ...overrides,
  } as TransactionStatus;
}

function buildParams(overrides?: {
  transaction?: Partial<Transaction>;
  status?: Partial<TransactionStatus>;
}) {
  const transaction = createBitcoinTransaction(overrides?.transaction);
  const status = createTransactionStatus(overrides?.status);
  const onUpdateTransaction = jest.fn();
  return {
    transaction,
    status,
    onUpdateTransaction,
    locale: "en",
    accountUnit: mockUnit,
  };
}

describe("useCoinControlAmountInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    formatAmountForInput.mockImplementation((_unit: unknown, amount: BigNumber) =>
      amount.isZero() ? "" : amount.toString(),
    );
    processRawInput.mockImplementation((raw: string) => ({
      display: raw,
      value: new BigNumber(raw || 0),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return amountValue, onAmountChange, cancelPendingUpdates and debounceTimeoutRef", () => {
    formatAmountForInput.mockReturnValue(null);
    const params = buildParams();

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current).toMatchObject({
      amountValue: null,
      onAmountChange: expect.any(Function),
      cancelPendingUpdates: expect.any(Function),
    });
    expect(result.current.debounceTimeoutRef).toEqual({ current: null });
  });

  it("should set initial amountValue from transaction.amount when not useAllAmount", () => {
    const amount = new BigNumber("100000000");
    formatAmountForInput.mockReturnValue("1");
    const params = buildParams({
      transaction: { amount, useAllAmount: false },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(formatAmountForInput).toHaveBeenCalledWith(mockUnit, amount, "en");
    expect(result.current.amountValue).toBe("1");
  });

  it("should set initial amountValue from status.amount when useAllAmount is true", () => {
    const statusAmount = new BigNumber("50000000");
    formatAmountForInput.mockReturnValue("0.5");
    const params = buildParams({
      transaction: { useAllAmount: true },
      status: { amount: statusAmount },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(formatAmountForInput).toHaveBeenCalledWith(mockUnit, statusAmount, "en");
    expect(result.current.amountValue).toBe("0.5");
  });

  it("should set initial amountValue to empty string when transaction.amount is zero", () => {
    formatAmountForInput.mockReturnValue("");
    const params = buildParams({
      transaction: { amount: new BigNumber(0) },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe("");
  });

  it("should set initial amountValue to null when transaction.amount is null", () => {
    formatAmountForInput.mockReturnValue(null);
    const params = buildParams({
      transaction: { amount: undefined },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe(null);
  });

  it("should update amountValue and debounce onUpdateTransaction when onAmountChange is called with raw string", () => {
    formatAmountForInput.mockReturnValue(null);
    const params = buildParams();

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe(null);

    act(() => {
      result.current.onAmountChange("0.001");
    });

    expect(processRawInput).toHaveBeenCalledWith("0.001", mockUnit, "en");
    expect(result.current.amountValue).toBe("0.001");
    expect(params.onUpdateTransaction).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(params.onUpdateTransaction).toHaveBeenCalledTimes(1);
    expect(params.onUpdateTransaction).toHaveBeenCalledWith({
      amount: new BigNumber(0.001).integerValue(BigNumber.ROUND_DOWN),
      useAllAmount: false,
    });
  });

  it("should cancel pending debounced update when cancelPendingUpdates is called", () => {
    formatAmountForInput.mockReturnValue(null);
    const params = buildParams();

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    act(() => {
      result.current.onAmountChange("1");
    });

    act(() => {
      result.current.cancelPendingUpdates();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(params.onUpdateTransaction).not.toHaveBeenCalled();
  });

  it("should pass integer amount (ROUND_DOWN) to onUpdateTransaction", () => {
    formatAmountForInput.mockReturnValue(null);
    processRawInput.mockReturnValue({
      display: "0.99999",
      value: new BigNumber("0.99999"),
    });
    const params = buildParams();

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    act(() => {
      result.current.onAmountChange("0.99999");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(params.onUpdateTransaction).toHaveBeenCalledWith({
      amount: new BigNumber(0),
      useAllAmount: false,
    });
  });
});
