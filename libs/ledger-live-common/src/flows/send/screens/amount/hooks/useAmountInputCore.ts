import { useCallback, useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionStatus } from "../../../../generated/types";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import {
  formatAmountForInput,
  formatFiatForInput,
  processRawInput,
  processFiatInput,
  calculateFiatEquivalent,
} from "../utils/amountInput";
import { syncAmountInputs } from "../utils/amountInputSync";

type UseAmountInputCoreParams = Readonly<{
  transaction: Transaction;
  status: TransactionStatus;
  locale: string;
  accountCurrency: Currency;
  accountUnit: Unit;
  counterValueCurrency: Currency;
  fiatUnit: Unit;
  cryptoAmount: BigNumber;
  fiatAmount: BigNumber;
  calculateCryptoAmount: (fiatAmount: BigNumber) => BigNumber | null | undefined;
  calculateFiatFromCrypto: (currency: Currency, amount: BigNumber) => BigNumber | null | undefined;
  onUpdateTransaction: (patch: Partial<Transaction>) => void;
}>;

export type AmountInputCoreResult = Readonly<{
  amountValue: string;
  currencyText: string;
  currencyPosition: "left" | "right";
  secondaryValue: string;
  inputMode: "fiat" | "crypto";
  amountInputMaxDecimalLength: number;
  onChangeText: (text: string) => void;
  onToggleInputMode: () => void;
  updateBothInputs: (amount: BigNumber) => void;
  cancelPendingUpdates: () => void;
  debounceTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}>;

export function useAmountInputCore({
  transaction,
  status,
  locale,
  accountCurrency,
  accountUnit,
  counterValueCurrency,
  fiatUnit,
  cryptoAmount,
  fiatAmount,
  calculateCryptoAmount,
  calculateFiatFromCrypto,
  onUpdateTransaction,
}: UseAmountInputCoreParams): AmountInputCoreResult {
  // When useAllAmount is true, the bridge calculates the actual amount (balance - fees)
  // This calculated amount is available in status.amount
  const effectiveCryptoAmount = useMemo(() => {
    if (transaction.useAllAmount) {
      // Use status.amount which already accounts for fees when useAllAmount is true
      return status.amount ?? new BigNumber(0);
    }
    return transaction.amount ?? new BigNumber(0);
  }, [transaction.amount, transaction.useAllAmount, status.amount]);

  const [inputMode, setInputMode] = useState<"fiat" | "crypto">("fiat");
  const [fiatInputValue, setFiatInputValue] = useState<string>("");
  const [cryptoInputValue, setCryptoInputValue] = useState<string>("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionAmountRef = useRef<BigNumber>(effectiveCryptoAmount);
  const lastFiatAmountRef = useRef<BigNumber>(fiatAmount);
  const lastUseAllAmountRef = useRef<boolean>(transaction.useAllAmount ?? false);
  const lastUserInputTimeRef = useRef<number>(0);

  // Sync input values when transaction amount changes externally (e.g., from quick actions)
  syncAmountInputs({
    cryptoAmount: effectiveCryptoAmount,
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
          : lastTransactionAmountRef.current ?? effectiveCryptoAmount;
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
    effectiveCryptoAmount,
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

  const handleChangeText = useCallback(
    (text: string) => {
      lastUserInputTimeRef.current = Date.now();

      if (inputMode === "fiat") {
        handleFiatInput(text);
      } else {
        handleCryptoInput(text);
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
        const source = lastTransactionAmountRef.current ?? effectiveCryptoAmount;
        const formatted = formatAmountForInput(accountUnit, source, locale);
        setCryptoInputValue(formatted);
      }

      return next;
    });
  }, [accountUnit, effectiveCryptoAmount, fiatAmount, fiatUnit, locale]);

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
    onChangeText: handleChangeText,
    onToggleInputMode: handleToggleMode,
    updateBothInputs,
    cancelPendingUpdates,
    debounceTimeoutRef,
  };
}
