import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
import { processRawInput } from "../../../utils/amountInput";

type UseAmountInputParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  onUpdateTransaction: (patch: Partial<Transaction>) => void;
}>;

export function useAmountInput({
  account,
  parentAccount,
  transaction,
  status,
  onUpdateTransaction,
}: UseAmountInputParams) {
  const locale = useSelector(localeSelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const [inputValue, setInputValue] = useState<string>("");

  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];

  // When useAllAmount is true, the bridge calculates the actual amount (balance - fees)
  // This calculated amount is available in status.amount
  const cryptoAmount = useMemo(() => {
    if (transaction.useAllAmount) {
      // Use status.amount which already accounts for fees when useAllAmount is true
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
    (event: ChangeEvent<HTMLInputElement>) => {
      lastUserInputTimeRef.current = Date.now();
      const rawValue = event.target.value;

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
