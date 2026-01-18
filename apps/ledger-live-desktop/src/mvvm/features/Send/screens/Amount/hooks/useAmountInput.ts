import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import {
  useSendAmount,
  useCalculateCountervalueCallback,
} from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import {
  formatAmountForInput,
  formatFiatForInput,
  processRawInput,
  processFiatInput,
  calculateFiatEquivalent,
} from "../utils/amountInput";
import { syncAmountInputs } from "../utils/amountInputSync";

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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const fiatUnit = counterValueCurrency.units[0];

  // When useAllAmount is true, the bridge calculates the actual amount (balance - fees)
  // This calculated amount is available in status.amount
  const cryptoAmount = useMemo(() => {
    if (transaction.useAllAmount) {
      // Use status.amount which already accounts for fees when useAllAmount is true
      return status.amount ?? new BigNumber(0);
    }
    return transaction.amount ?? new BigNumber(0);
  }, [transaction.amount, transaction.useAllAmount, status.amount]);

  const { fiatAmount, calculateCryptoAmount } = useSendAmount({
    account,
    fiatCurrency: counterValueCurrency,
    cryptoAmount,
  });
  const calculateFiatFromCrypto = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

  const [inputMode, setInputMode] = useState<"fiat" | "crypto">("fiat");
  const [fiatInputValue, setFiatInputValue] = useState<string>("");
  const [cryptoInputValue, setCryptoInputValue] = useState<string>("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionAmountRef = useRef<BigNumber>(cryptoAmount);
  const lastFiatAmountRef = useRef<BigNumber>(fiatAmount);
  const lastUseAllAmountRef = useRef<boolean>(transaction.useAllAmount ?? false);
  const lastUserInputTimeRef = useRef<number>(0);

  // Sync input values when transaction amount changes externally (e.g., from quick actions)
  syncAmountInputs({
    cryptoAmount,
    fiatAmount,
    transactionUseAllAmount: Boolean(transaction.useAllAmount),
    inputMode,
    cryptoInputValue,
    fiatInputValue,
    locale,
    accountUnit,
    fiatUnit,
    lastTransactionAmountRef,
    lastFiatAmountRef,
    lastUseAllAmountRef,
    lastUserInputTimeRef,
    setCryptoInputValue,
    setFiatInputValue,
  });

  const amountValue = inputMode === "fiat" ? fiatInputValue : cryptoInputValue;
  const currencyText =
    inputMode === "fiat" ? counterValueCurrency.symbol ?? fiatUnit.code : accountUnit.code;
  const currencyPosition: "left" | "right" = inputMode === "fiat" ? "left" : "right";

  const secondaryValue = useMemo(() => {
    if (inputMode === "fiat") {
      const cryptoSource =
        cryptoInputValue && cryptoInputValue.length > 0
          ? lastTransactionAmountRef.current
          : lastTransactionAmountRef.current ?? cryptoAmount;
      return formatCurrencyUnit(accountUnit, cryptoSource ?? new BigNumber(0), {
        showCode: true,
        disableRounding: true,
        locale,
      });
    }
    const fiatSource =
      fiatInputValue && fiatInputValue.length > 0
        ? lastFiatAmountRef.current
        : lastFiatAmountRef.current ?? fiatAmount;
    return formatCurrencyUnit(fiatUnit, fiatSource ?? new BigNumber(0), {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [
    accountUnit,
    cryptoAmount,
    cryptoInputValue,
    fiatAmount,
    fiatInputValue,
    fiatUnit,
    inputMode,
    locale,
  ]);

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

  const handleFiatInput = useCallback(
    (rawValue: string) => {
      const processed = processFiatInput(rawValue, fiatUnit, locale);
      setFiatInputValue(processed.clampedDisplay);

      if (processed.isOverLimit) {
        return;
      }

      const nextAmount = calculateCryptoAmount(processed.value) ?? new BigNumber(0);
      lastFiatAmountRef.current = processed.value;
      lastTransactionAmountRef.current = nextAmount;
      debouncedUpdateTransaction({
        amount: nextAmount.integerValue(BigNumber.ROUND_DOWN),
        useAllAmount: false,
      });
    },
    [calculateCryptoAmount, debouncedUpdateTransaction, fiatUnit, locale],
  );

  const handleCryptoInput = useCallback(
    (rawValue: string) => {
      const processed = processRawInput(rawValue, accountUnit, locale);
      setCryptoInputValue(processed.display);

      lastTransactionAmountRef.current = processed.value;
      const fiatEquivalent = calculateFiatFromCrypto(accountCurrency, processed.value);
      lastFiatAmountRef.current =
        fiatEquivalent?.isFinite() && !fiatEquivalent.isNaN() ? fiatEquivalent : new BigNumber(0);
      debouncedUpdateTransaction({
        amount: processed.value.integerValue(BigNumber.ROUND_DOWN),
        useAllAmount: false,
      });
    },
    [accountCurrency, accountUnit, calculateFiatFromCrypto, debouncedUpdateTransaction, locale],
  );

  const handleAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      lastUserInputTimeRef.current = Date.now();
      const raw = event.target.value;

      if (inputMode === "fiat") {
        handleFiatInput(raw);
      } else {
        handleCryptoInput(raw);
      }
    },
    [handleCryptoInput, handleFiatInput, inputMode],
  );

  const handleToggleMode = useCallback(() => {
    lastUserInputTimeRef.current = Date.now();
    setInputMode(prev => {
      const next = prev === "fiat" ? "crypto" : "fiat";

      if (next === "fiat") {
        const source = lastFiatAmountRef.current ?? fiatAmount;
        const formatted = formatFiatForInput(fiatUnit, source, locale);
        setFiatInputValue(formatted);
      } else {
        const source = lastTransactionAmountRef.current ?? cryptoAmount;
        const formatted = formatAmountForInput(accountUnit, source, locale);
        setCryptoInputValue(formatted);
      }

      return next;
    });
  }, [accountUnit, cryptoAmount, fiatAmount, fiatUnit, locale]);

  const updateBothInputs = useCallback(
    (amount: BigNumber) => {
      // Quick action: update inputs immediately for instant feedback,
      // then let bridge sync take over once it responds.
      lastUserInputTimeRef.current = 0;

      // Update crypto input
      const cryptoFormatted = formatAmountForInput(accountUnit, amount, locale);
      setCryptoInputValue(cryptoFormatted);

      // Calculate and update fiat input
      const fiatEquivalent = calculateFiatEquivalent({
        amount,
        lastTransactionAmount: lastTransactionAmountRef.current,
        lastFiatAmount: lastFiatAmountRef.current,
        calculateFiatFromCrypto: value => calculateFiatFromCrypto(accountCurrency, value),
      });

      if (fiatEquivalent?.isFinite() && !fiatEquivalent?.isNaN() && fiatEquivalent?.gt(0)) {
        const formatted = formatFiatForInput(fiatUnit, fiatEquivalent, locale);
        setFiatInputValue(formatted);
      } else if (amount.isZero()) {
        setFiatInputValue("");
      }
    },
    [accountCurrency, accountUnit, calculateFiatFromCrypto, fiatUnit, locale],
  );

  const amountInputMaxDecimalLength = inputMode === "fiat" ? 2 : Math.max(0, accountUnit.magnitude);

  return {
    amountValue,
    currencyText,
    currencyPosition,
    secondaryValue,
    inputMode,
    amountInputMaxDecimalLength,
    onAmountChange: handleAmountChange,
    onToggleInputMode: handleToggleMode,
    updateBothInputs,
    cancelPendingUpdates,
    debounceTimeoutRef,
  };
}
