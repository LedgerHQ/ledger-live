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
import { sanitizeValueString } from "@ledgerhq/coin-framework/currencies/sanitizeValueString";

function clampDecimals(display: string): string {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return display;

  const integerPart = display.slice(0, sepIndex);
  const sep = display[sepIndex];
  const decimals = display.slice(sepIndex + 1);
  if (decimals.length <= 2) return display;
  return `${integerPart}${sep}${decimals.slice(0, 2)}`;
}

function isOverDecimalLimit(display: string): boolean {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return false;
  return display.length - sepIndex - 1 > 2;
}

function trimTrailingZeros(display: string): string {
  const dotIndex = display.lastIndexOf(".");
  const commaIndex = display.lastIndexOf(",");
  const sepIndex = Math.max(dotIndex, commaIndex);
  if (sepIndex === -1) return display;

  const integerPart = display.slice(0, sepIndex);
  const sep = display[sepIndex];
  let decimals = display.slice(sepIndex + 1);
  decimals = decimals.replace(/0+$/, "");
  if (!decimals) return integerPart;
  return `${integerPart}${sep}${decimals}`;
}

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
  const useAllAmountChanged = (transaction.useAllAmount ?? false) !== lastUseAllAmountRef.current;
  const cryptoAmountChanged =
    !cryptoAmount.eq(lastTransactionAmountRef.current) || useAllAmountChanged;
  const fiatAmountChanged = !fiatAmount.eq(lastFiatAmountRef.current);
  const timeSinceUserInput = Date.now() - lastUserInputTimeRef.current;
  // Allow immediate sync when useAllAmount changes (Max button) or after debounce delay
  const canSyncWithBridge = useAllAmountChanged || timeSinceUserInput > 200;
  const isQuickAction = lastUserInputTimeRef.current === 0;

  if (cryptoAmountChanged && canSyncWithBridge) {
    lastTransactionAmountRef.current = cryptoAmount;
    if (useAllAmountChanged) {
      lastUseAllAmountRef.current = transaction.useAllAmount ?? false;
      lastUserInputTimeRef.current = 0;
    }

    // Allow sync if quick action (lastUserInputTimeRef === 0) or not actively typing in crypto
    // When useAllAmount changes, always sync to show the calculated max amount
    const shouldSyncCryptoInput =
      isQuickAction ||
      useAllAmountChanged ||
      !(inputMode === "crypto" && cryptoInputValue.length > 0);
    if (shouldSyncCryptoInput) {
      const cryptoFormatted = formatCurrencyUnit(accountUnit, cryptoAmount, {
        showCode: false,
        disableRounding: true,
        useGrouping: false,
        locale,
      });
      setCryptoInputValue(cryptoAmount.isZero() ? "" : cryptoFormatted);
    }
  }

  // Update fiat input when fiatAmount changes (which happens after cryptoAmount changes)
  if ((cryptoAmountChanged || fiatAmountChanged) && canSyncWithBridge) {
    lastFiatAmountRef.current = fiatAmount;

    // Allow sync if quick action (lastUserInputTimeRef === 0) or not actively typing in fiat
    const isQuickAction = lastUserInputTimeRef.current === 0;
    const shouldSyncFiatInput =
      isQuickAction || useAllAmountChanged || !(inputMode === "fiat" && fiatInputValue.length > 0);
    if (shouldSyncFiatInput) {
      const fiatFormatted = formatCurrencyUnit(fiatUnit, fiatAmount, {
        showCode: false,
        disableRounding: true,
        useGrouping: false,
        locale,
      });
      const clamped = clampDecimals(fiatFormatted);
      const trimmed = trimTrailingZeros(clamped);
      setFiatInputValue(fiatAmount.isZero() ? "" : trimmed);
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

  const handleAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      lastUserInputTimeRef.current = Date.now();
      const raw = event.target.value;
      if (inputMode === "fiat") {
        const sanitized = sanitizeValueString(fiatUnit, raw, locale);
        const clampedDisplay = clampDecimals(sanitized.display);
        const nextSanitized = sanitizeValueString(fiatUnit, clampedDisplay, locale);

        // Strict: make it impossible to type more than fiatUnit.magnitude decimals.
        // Controlled input will always render the clamped value.
        setFiatInputValue(clampedDisplay);
        if (isOverDecimalLimit(sanitized.display)) {
          return;
        }
        const fiatBase = nextSanitized.value
          ? new BigNumber(nextSanitized.value)
          : new BigNumber(0);
        const nextAmount = calculateCryptoAmount(fiatBase) ?? new BigNumber(0);
        lastFiatAmountRef.current = fiatBase;
        lastTransactionAmountRef.current = nextAmount;
        debouncedUpdateTransaction({
          amount: nextAmount.integerValue(BigNumber.ROUND_DOWN),
          useAllAmount: false,
        });
        return;
      }

      const sanitized = sanitizeValueString(accountUnit, raw, locale);
      setCryptoInputValue(sanitized.display);
      const atomicString = sanitized.value;
      const atomic = atomicString ? new BigNumber(atomicString) : new BigNumber(0);
      const nextAmount = atomic.isFinite() && !atomic.isNaN() ? atomic : new BigNumber(0);
      lastTransactionAmountRef.current = nextAmount;
      const fiatEquivalent = calculateFiatFromCrypto(accountCurrency, nextAmount);
      lastFiatAmountRef.current =
        fiatEquivalent && fiatEquivalent.isFinite() && !fiatEquivalent.isNaN()
          ? fiatEquivalent
          : new BigNumber(0);
      debouncedUpdateTransaction({
        amount: nextAmount.integerValue(BigNumber.ROUND_DOWN),
        useAllAmount: false,
      });
    },
    [
      accountCurrency,
      accountUnit,
      calculateCryptoAmount,
      calculateFiatFromCrypto,
      debouncedUpdateTransaction,
      fiatUnit,
      inputMode,
      locale,
    ],
  );

  const handleToggleMode = useCallback(() => {
    lastUserInputTimeRef.current = Date.now();
    setInputMode(prev => {
      const next = prev === "fiat" ? "crypto" : "fiat";
      if (next === "fiat") {
        const source = lastFiatAmountRef.current ?? fiatAmount;
        if (source.isZero()) {
          setFiatInputValue("");
        } else {
          const formatted = formatCurrencyUnit(fiatUnit, source, {
            showCode: false,
            disableRounding: true,
            useGrouping: false,
            locale,
          });
          const clamped = clampDecimals(formatted);
          setFiatInputValue(trimTrailingZeros(clamped));
        }
      } else {
        const source = lastTransactionAmountRef.current ?? cryptoAmount;
        const formatted = source.isZero()
          ? ""
          : formatCurrencyUnit(accountUnit, source, {
              showCode: false,
              disableRounding: true,
              useGrouping: false,
              locale,
            });
        setCryptoInputValue(formatted);
      }
      return next;
    });
  }, [accountUnit, cryptoAmount, fiatAmount, fiatUnit, locale]);

  const updateBothInputs = useCallback(
    (amount: BigNumber) => {
      // Quick action: update inputs immediately for instant feedback,
      // then let bridge sync take over once it responds.
      // We reset lastUserInputTime to 0 to allow bridge sync to override.
      lastUserInputTimeRef.current = 0;

      // Update crypto input
      const cryptoFormatted = formatCurrencyUnit(accountUnit, amount, {
        showCode: false,
        disableRounding: true,
        useGrouping: false,
        locale,
      });
      setCryptoInputValue(amount.isZero() ? "" : cryptoFormatted);

      // Calculate fiat equivalent using the same logic as useSendAmount
      const directFiat = calculateFiatFromCrypto(accountCurrency, amount);
      const ratioFiat =
        lastTransactionAmountRef.current &&
        !lastTransactionAmountRef.current.isZero() &&
        lastFiatAmountRef.current &&
        !lastFiatAmountRef.current.isZero()
          ? lastFiatAmountRef.current
              .multipliedBy(amount)
              .dividedBy(lastTransactionAmountRef.current)
          : null;
      const fiatBase = directFiat ?? ratioFiat;

      if (fiatBase && fiatBase.isFinite() && !fiatBase.isNaN() && fiatBase.gt(0)) {
        const fiatFormatted = formatCurrencyUnit(fiatUnit, fiatBase, {
          showCode: false,
          disableRounding: true,
          useGrouping: false,
          locale,
        });
        const clamped = clampDecimals(fiatFormatted);
        setFiatInputValue(trimTrailingZeros(clamped));
      } else {
        if (amount.isZero()) {
          setFiatInputValue("");
        }
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
