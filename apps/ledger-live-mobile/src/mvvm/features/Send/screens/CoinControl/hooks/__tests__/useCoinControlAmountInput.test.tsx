/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import { act, renderHook } from "@testing-library/react-native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createMockAccount } from "../../../Recipient/hooks/__tests__/accounts";
import { useCoinControlAmountInput } from "../useCoinControlAmountInput";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

import { createBitcoinTransaction, createTransactionStatus, isAccount } from "./helpers";

jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers");

const { getMainAccount, getAccountCurrency } = jest.requireMock(
  "@ledgerhq/ledger-wallet-framework/account/helpers",
);

jest.mock("~/hooks", () => ({
  useMaybeAccountUnit: jest.fn(() => ({ magnitude: 8, code: "BTC", name: "Bitcoin" })),
}));

function buildParams(overrides?: {
  account?: Partial<Account>;
  transaction?: Partial<Transaction>;
  status?: Partial<TransactionStatus>;
}) {
  const currency = getCryptoCurrencyById("bitcoin");
  const account = createMockAccount({
    id: "bitcoin-account",
    currency,
    ...overrides?.account,
  });

  (getMainAccount as jest.Mock).mockImplementation((acc: Account | unknown) => {
    if (!isAccount(acc)) throw new Error("TokenAccount not supported");
    return acc;
  });
  (getAccountCurrency as jest.Mock).mockReturnValue(currency);

  const transaction = createBitcoinTransaction(overrides?.transaction);
  const status = createTransactionStatus(overrides?.status);
  const onUpdateTransaction = jest.fn();

  return {
    account,
    parentAccount: null as Account | null,
    transaction,
    status,
    onUpdateTransaction,
    locale: "en",
  };
}

describe("useCoinControlAmountInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return amountValue, onAmountChange, cancelPendingUpdates and debounceTimeoutRef", () => {
    const params = buildParams({ transaction: { amount: undefined } });

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
    const params = buildParams({
      transaction: { amount, useAllAmount: false },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe("1");
  });

  it("should set initial amountValue from status.amount when useAllAmount is true", () => {
    const statusAmount = new BigNumber("50000000");
    const params = buildParams({
      transaction: { useAllAmount: true },
      status: { amount: statusAmount },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe("0.5");
  });

  it("should set initial amountValue to empty string when transaction.amount is zero", () => {
    const params = buildParams({
      transaction: { amount: new BigNumber(0) },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe("");
  });

  it("should set initial amountValue to null when transaction.amount is null", () => {
    const params = buildParams({
      transaction: { amount: undefined },
    });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe(null);
  });

  it("should update amountValue and debounce onUpdateTransaction when onAmountChange is called", () => {
    const params = buildParams({ transaction: { amount: undefined } });

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe(null);

    act(() => {
      result.current.onAmountChange("0.001");
    });

    expect(result.current.amountValue).toBe("0.001");
    expect(params.onUpdateTransaction).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(params.onUpdateTransaction).toHaveBeenCalledTimes(1);
    expect(params.onUpdateTransaction).toHaveBeenCalledWith({
      amount: new BigNumber(100000),
      useAllAmount: false,
    });
  });

  it("should cancel pending debounced update when cancelPendingUpdates is called", () => {
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

  it("should pass the amount in integer base units to onUpdateTransaction", () => {
    const params = buildParams();

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    act(() => {
      result.current.onAmountChange("0.99999");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(params.onUpdateTransaction).toHaveBeenCalledWith({
      amount: new BigNumber(99999000),
      useAllAmount: false,
    });
  });
});
