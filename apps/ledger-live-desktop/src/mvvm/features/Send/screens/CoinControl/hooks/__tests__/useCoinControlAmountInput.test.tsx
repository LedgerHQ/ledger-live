/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { act, renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../../Recipient/__integrations__/__fixtures__/accounts";
import { useCoinControlAmountInput } from "../useCoinControlAmountInput";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { bitcoinPickingStrategy } from "@ledgerhq/live-common/families/bitcoin/types";

jest.mock("@ledgerhq/coin-framework/account/helpers");
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: jest.fn(() => ({ magnitude: 8, code: "BTC", name: "Bitcoin" })),
}));

const formatAmountForInput = jest.fn();
const processRawInput = jest.fn();

jest.mock("@ledgerhq/live-common/flows/send/amount/utils/amountInput", () => ({
  formatAmountForInput: (...args: unknown[]) => formatAmountForInput(...args),
  processRawInput: (...args: unknown[]) => processRawInput(...args),
}));

const { getMainAccount, getAccountCurrency } = jest.requireMock(
  "@ledgerhq/coin-framework/account/helpers",
);

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

function isAccount(account: unknown): account is Account {
  return (
    typeof account === "object" &&
    account !== null &&
    "type" in account &&
    (account as Account).type === "Account"
  );
}

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

    expect(formatAmountForInput).toHaveBeenCalledWith(expect.any(Object), amount, "en");
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

    expect(formatAmountForInput).toHaveBeenCalledWith(expect.any(Object), statusAmount, "en");
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

  it("should update amountValue and debounce onUpdateTransaction when onAmountChange is called", () => {
    formatAmountForInput.mockReturnValue(null);
    const params = buildParams();

    const { result } = renderHook(() => useCoinControlAmountInput(params));

    expect(result.current.amountValue).toBe(null);

    act(() => {
      result.current.onAmountChange({
        target: { value: "0.001" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(processRawInput).toHaveBeenCalledWith("0.001", expect.any(Object), "en");
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
      result.current.onAmountChange({
        target: { value: "1" },
      } as React.ChangeEvent<HTMLInputElement>);
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
      result.current.onAmountChange({
        target: { value: "0.99999" },
      } as React.ChangeEvent<HTMLInputElement>);
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
