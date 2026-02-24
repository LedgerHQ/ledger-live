import { useCallback, useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "~/context/hooks";
import {
  useSendAmount,
  useCalculateCountervalueCallback,
} from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useLocale } from "~/context/Locale";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import {
  formatAmountForInput,
  formatFiatForInput,
  processRawInput,
  processFiatInput,
  calculateFiatEquivalent,
} from "@ledgerhq/live-common/flows/send/amount/utils/amountInput";

type UseAmountInputControllerParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  onUpdateTransaction: (patch: Partial<Transaction>) => void;
}>;

/**
 * Mobile-specific amount input controller
 */
export function useAmountInputController({
  account,
  parentAccount,
  transaction,
  status,
  onUpdateTransaction,
}: UseAmountInputControllerParams) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { locale } = useLocale();

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const fiatUnit = counterValueCurrency.units[0];

  // When useAllAmount is true, the bridge calculates the actual amount (balance - fees)
  const cryptoAmount = useMemo(() => {
    if (transaction.useAllAmount) {
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
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionAmountRef = useRef<BigNumber>(cryptoAmount);
  const lastFiatAmountRef = useRef<BigNumber>(fiatAmount);
  const lastUserInputTimeRef = useRef<number>(0);

  if (transaction.useAllAmount) {
    if (inputMode === "fiat") {
      const formatted = formatFiatForInput(fiatUnit, fiatAmount, locale);
      if (formatted !== fiatInputValue) {
        setFiatInputValue(formatted);
      }
    } else {
      const formatted = formatAmountForInput(accountUnit, cryptoAmount, locale);
      if (formatted !== cryptoInputValue) {
        setCryptoInputValue(formatted);
      }
    }
  }

  const amountValue = inputMode === "fiat" ? fiatInputValue : cryptoInputValue;
  const currencyText =
    inputMode === "fiat" ? counterValueCurrency.symbol ?? fiatUnit.code : accountUnit.code;
  const currencyPosition: "left" | "right" = inputMode === "fiat" ? "left" : "right";

  const secondaryValue = useMemo(() => {
    if (inputMode === "fiat") {
      const cryptoSource =
        cryptoInputValue && cryptoInputValue.length > 0
          ? lastTransactionAmountRef.current
          : cryptoAmount;
      return formatCurrencyUnit(accountUnit, cryptoSource ?? new BigNumber(0), {
        showCode: true,
        disableRounding: true,
        locale,
      });
    }
    const fiatSource =
      fiatInputValue && fiatInputValue.length > 0 ? lastFiatAmountRef.current : fiatAmount;
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

  // Keep tracking refs in sync with bridge-computed amounts.
  // Updated after secondaryValue so it reads the previous cycle's values (intentional).
  lastTransactionAmountRef.current = cryptoAmount;
  lastFiatAmountRef.current = fiatAmount;

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

      setFiatInputValue(processed.display);

      // Don't update transaction if user is typing more than 2 decimals
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
    (text: string) => {
      lastUserInputTimeRef.current = Date.now();

      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        typingTimeoutRef.current = null;
      }, 2000);

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
        const source = lastTransactionAmountRef.current ?? cryptoAmount;
        const formatted = formatAmountForInput(accountUnit, source, locale);
        setCryptoInputValue(formatted);
      }

      return next;
    });
  }, [accountUnit, cryptoAmount, fiatAmount, fiatUnit, locale]);

  const updateBothInputs = useCallback(
    (amount: BigNumber) => {
      lastUserInputTimeRef.current = 0;

      const cryptoFormatted = formatAmountForInput(accountUnit, amount, locale);
      setCryptoInputValue(cryptoFormatted);

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

  return useMemo(
    () => ({
      value: amountValue,
      currencyText,
      currencyPosition,
      secondaryValue,
      inputMode,
      maxDecimalLength: amountInputMaxDecimalLength,
      isTyping,
      onChangeText: handleAmountChange,
      onToggleMode: handleToggleMode,
      updateBothInputs,
      cancelPendingUpdates,
    }),
    [
      amountValue,
      currencyText,
      currencyPosition,
      secondaryValue,
      inputMode,
      amountInputMaxDecimalLength,
      isTyping,
      handleAmountChange,
      handleToggleMode,
      updateBothInputs,
      cancelPendingUpdates,
    ],
  );
}
