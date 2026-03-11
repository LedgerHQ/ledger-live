import type { Unit } from "@ledgerhq/types-cryptoassets";
import { formatAmountForInput, processRawInput } from "../../amount/utils/amountInput";
import type { Transaction, TransactionStatus } from "../../../../generated/types";
import { BigNumber } from "bignumber.js";
import { useCallback, useMemo, useRef, useState } from "react";

export type UseCoinControlAmountInputParams = Readonly<{
  transaction: Transaction;
  status: TransactionStatus;
  onUpdateTransaction: (patch: Partial<Transaction>) => void;
  locale: string;
  accountUnit: Unit;
}>;

export type UseCoinControlAmountInputResult = Readonly<{
  amountValue: string | null;
  onAmountChange: (rawValue: string) => void;
  cancelPendingUpdates: () => void;
  debounceTimeoutRef: { current: NodeJS.Timeout | null };
}>;

/**
 * Shared hook for CoinControl amount input state.
 * Accepts accountUnit from the caller so apps can use useMaybeAccountUnit or similar.
 * onAmountChange is string-based; desktop views should adapt from ChangeEvent (e.target.value).
 */
export function useCoinControlAmountInput({
  transaction,
  status,
  onUpdateTransaction,
  locale,
  accountUnit,
}: UseCoinControlAmountInputParams): UseCoinControlAmountInputResult {
  const initialFormattedValue = useMemo(() => {
    const amount =
      transaction.useAllAmount && status.amount != null
        ? status.amount
        : transaction.amount ?? null;
    return amount ? formatAmountForInput(accountUnit, amount, locale) : null;
  }, [accountUnit, locale, status.amount, transaction.amount, transaction.useAllAmount]);

  const [inputValue, setInputValue] = useState<string | null>(initialFormattedValue);

  const cryptoAmount = useMemo(() => {
    if (transaction.useAllAmount) {
      return status.amount ?? new BigNumber(0);
    }
    return transaction.amount ?? new BigNumber(0);
  }, [transaction.amount, transaction.useAllAmount, status.amount]);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionAmountRef = useRef<BigNumber>(cryptoAmount);
  const lastUserInputTimeRef = useRef<number>(0);

  const cancelPendingUpdates = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  const debouncedUpdateTransaction = useCallback(
    (patch: Partial<Transaction>) => {
      cancelPendingUpdates();
      debounceTimeoutRef.current = setTimeout(() => {
        onUpdateTransaction(patch);
        debounceTimeoutRef.current = null;
      }, 500);
    },
    [cancelPendingUpdates, onUpdateTransaction],
  );

  const handleAmountChange = useCallback(
    (rawValue: string) => {
      lastUserInputTimeRef.current = Date.now();
      const processed = processRawInput(rawValue, accountUnit, locale);
      setInputValue(processed.display);
      lastTransactionAmountRef.current = processed.value;
      debouncedUpdateTransaction({
        amount: processed.value.integerValue(BigNumber.ROUND_DOWN),
        useAllAmount: false,
      });
    },
    [debouncedUpdateTransaction, accountUnit, locale],
  );

  return {
    amountValue: inputValue,
    onAmountChange: handleAmountChange,
    cancelPendingUpdates,
    debounceTimeoutRef,
  };
}
