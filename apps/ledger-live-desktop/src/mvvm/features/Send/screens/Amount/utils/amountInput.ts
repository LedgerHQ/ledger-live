import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { sanitizeValueString } from "@ledgerhq/coin-framework/currencies/sanitizeValueString";
import { clampDecimals, isOverDecimalLimit, trimTrailingZeros } from "./decimals";

export type FormattedAmount = Readonly<{
  display: string;
  value: BigNumber;
}>;

const formatUnitForInput = (unit: Unit, amount: BigNumber, locale: string): string =>
  formatCurrencyUnit(unit, amount, {
    showCode: false,
    disableRounding: true,
    useGrouping: false,
    locale,
  });

export function formatAmountForInput(unit: Unit, amount: BigNumber, locale: string): string {
  if (amount.isZero()) return "";
  return formatUnitForInput(unit, amount, locale);
}

export function formatFiatForInput(unit: Unit, amount: BigNumber, locale: string): string {
  if (amount.isZero()) return "";
  const formatted = formatUnitForInput(unit, amount, locale);
  return trimTrailingZeros(clampDecimals(formatted));
}

export function processRawInput(rawValue: string, unit: Unit, locale: string): FormattedAmount {
  const sanitized = sanitizeValueString(unit, rawValue, locale);
  const value = sanitized.value ? new BigNumber(sanitized.value) : new BigNumber(0);

  return {
    display: sanitized.display,
    value: value.isFinite() && !value.isNaN() ? value : new BigNumber(0),
  };
}

export function processFiatInput(
  rawValue: string,
  fiatUnit: Unit,
  locale: string,
): Readonly<{
  display: string;
  clampedDisplay: string;
  value: BigNumber;
  isOverLimit: boolean;
}> {
  const sanitized = sanitizeValueString(fiatUnit, rawValue, locale);
  const clampedDisplay = clampDecimals(sanitized.display);
  const nextSanitized = sanitizeValueString(fiatUnit, clampedDisplay, locale);
  const value = nextSanitized.value ? new BigNumber(nextSanitized.value) : new BigNumber(0);
  // Keep the same behavior as the hook did previously:
  // - we clamp what is displayed,
  // - and we avoid pushing transaction updates while the user is typing > 2 decimals.
  const isOverLimit = isOverDecimalLimit(sanitized.display);

  return {
    display: sanitized.display,
    clampedDisplay,
    value,
    isOverLimit,
  };
}

export function calculateFiatEquivalent(params: {
  amount: BigNumber;
  lastTransactionAmount: BigNumber;
  lastFiatAmount: BigNumber;
  calculateFiatFromCrypto: (amount: BigNumber) => BigNumber | null | undefined;
}): BigNumber | null {
  const directFiat = params.calculateFiatFromCrypto(params.amount);

  const ratioFiat =
    params.lastTransactionAmount &&
    !params.lastTransactionAmount.isZero() &&
    params.lastFiatAmount &&
    !params.lastFiatAmount.isZero()
      ? params.lastFiatAmount.multipliedBy(params.amount).dividedBy(params.lastTransactionAmount)
      : null;

  return directFiat ?? ratioFiat;
}

export function shouldSyncInput(params: {
  isQuickAction: boolean;
  useAllAmountChanged: boolean;
  isActiveInput: boolean;
  hasInputValue: boolean;
}): boolean {
  return (
    params.isQuickAction ||
    params.useAllAmountChanged ||
    !(params.isActiveInput && params.hasInputValue)
  );
}
