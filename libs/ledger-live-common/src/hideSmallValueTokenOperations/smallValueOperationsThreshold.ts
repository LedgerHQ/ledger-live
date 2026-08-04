import BigNumber from "bignumber.js";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { getAccountCurrency } from "../account";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { formatCurrencyUnit } from "../currencies";
import type { Unit } from "@domain/entity-currency-unit";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike, Operation } from "@ledgerhq/types-live";

export const MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD = 0.5;
export const SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY = getFiatCurrencyByTicker("USD");

const getMagnitudeFactor = (currency: Currency) =>
  new BigNumber(10).pow(currency.units[0].magnitude);

export const clampSmallValueThresholdUsd = (threshold: number, fallback: number) =>
  Number.isFinite(threshold)
    ? Math.min(MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD, Math.max(0, threshold))
    : fallback;

export const floorThresholdToCurrencyMinorUnit = (
  threshold: number,
  currency: Currency,
): BigNumber | null => {
  if (!Number.isFinite(threshold)) {
    return null;
  }

  return new BigNumber(threshold)
    .times(getMagnitudeFactor(currency))
    .decimalPlaces(0, BigNumber.ROUND_FLOOR);
};

export const convertThresholdMinorUnitToMajor = (
  thresholdMinorUnit: BigNumber,
  currency: Currency,
) => thresholdMinorUnit.div(getMagnitudeFactor(currency));

export const formatThresholdMinorUnitForInput = (
  thresholdMinorUnit: BigNumber,
  currency: Currency,
) => convertThresholdMinorUnitToMajor(thresholdMinorUnit, currency).toFixed();

const formatCounterValueThreshold = ({
  currency,
  locale,
  thresholdMinorUnit,
}: {
  currency: Currency;
  locale: string | null | undefined;
  thresholdMinorUnit: BigNumber;
}) => {
  const unit = currency.units[0];
  const amount = convertThresholdMinorUnitToMajor(thresholdMinorUnit, currency);
  const fractionDigits = Math.min(Math.max(unit.magnitude + 2, 4), 8);
  const formattedAmount = new Intl.NumberFormat(locale ?? undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(amount.toNumber());

  return unit.prefixCode
    ? `${unit.code}${formattedAmount}`
    : `${formattedAmount}\u00A0${unit.code}`;
};

const formatReferenceThreshold = ({
  locale,
  thresholdUsd,
}: {
  locale: string | null | undefined;
  thresholdUsd: number;
}) => {
  const unit: Unit = {
    ...SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.units[0],
    code: "US$",
  };
  const thresholdMinorUnit =
    floorThresholdToCurrencyMinorUnit(
      thresholdUsd,
      SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
    ) ?? new BigNumber(0);

  return formatCurrencyUnit(unit, thresholdMinorUnit, {
    showCode: true,
    locale: locale ?? undefined,
  });
};

export function formatSmallValueOperationsThreshold({
  countervaluesState,
  counterValueCurrency,
  locale,
  thresholdUsd,
}: {
  countervaluesState?: CounterValuesState;
  counterValueCurrency: Currency;
  locale: string | null | undefined;
  thresholdUsd: number;
}) {
  const referenceThreshold = formatReferenceThreshold({ locale, thresholdUsd });

  if (counterValueCurrency.ticker === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.ticker) {
    return referenceThreshold;
  }

  if (!countervaluesState) return referenceThreshold;

  const counterValueThresholdMinorUnit = convertThresholdFromUsdToCountervalueMinorUnit({
    counterValueCurrency,
    countervaluesState,
    thresholdUsd,
  });

  if (!counterValueThresholdMinorUnit) return referenceThreshold;

  return `${referenceThreshold} (${formatCounterValueThreshold({
    currency: counterValueCurrency,
    locale,
    thresholdMinorUnit: counterValueThresholdMinorUnit,
  })})`;
}

export function convertThresholdFromUsdToCountervalueMinorUnit({
  counterValueCurrency,
  countervaluesState,
  thresholdUsd,
}: {
  counterValueCurrency: Currency;
  countervaluesState: CounterValuesState;
  thresholdUsd: number;
}): BigNumber | null {
  const usdMinorUnit = floorThresholdToCurrencyMinorUnit(
    clampSmallValueThresholdUsd(thresholdUsd, 0),
    SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
  );

  if (!usdMinorUnit) return null;

  const rawCountervalueMinorUnit = calculate(countervaluesState, {
    from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
    to: counterValueCurrency,
    value: usdMinorUnit.toNumber(),
    disableRounding: true,
  });

  if (typeof rawCountervalueMinorUnit !== "number" || !Number.isFinite(rawCountervalueMinorUnit)) {
    return null;
  }

  return new BigNumber(rawCountervalueMinorUnit);
}

export function convertThresholdFromCountervalueMinorUnitToUsd({
  counterValueCurrency,
  countervaluesState,
  thresholdMinorUnit,
}: {
  counterValueCurrency: Currency;
  countervaluesState: CounterValuesState;
  thresholdMinorUnit: BigNumber;
}): number | null {
  const rawUsdMinorUnit = calculate(countervaluesState, {
    from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
    to: counterValueCurrency,
    value: thresholdMinorUnit.toNumber(),
    disableRounding: true,
    reverse: true,
  });

  if (typeof rawUsdMinorUnit !== "number" || !Number.isFinite(rawUsdMinorUnit)) {
    return null;
  }

  return new BigNumber(rawUsdMinorUnit)
    .div(getMagnitudeFactor(SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY))
    .toNumber();
}

/**
 * Returns `true` when an incoming or outgoing operation should be hidden as a
 * "small-value" (dust) transaction.
 *
 * An operation is considered dust when:
 * - its type is "IN" or "OUT", AND
 * - either its crypto value is exactly zero, OR its fiat countervalue is
 *   strictly below the configured USD threshold (defaults to $0.5,
 *   overridable via ff).
 *
 * When the fiat countervalue cannot be computed (e.g. price feed unavailable),
 * the operation is NOT filtered so that legitimate transactions are never
 * accidentally hidden.
 *
 * The comparison is performed in the user's countervalue currency space:
 * we convert both the operation amount and the USD threshold to user-fiat
 * minor units, then compare those raw values.
 */
export function isSmallValueOperation({
  operation,
  account,
  countervaluesState,
  userCounterValueCurrency,
  thresholdUsd = MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD,
}: {
  operation: Operation;
  account: AccountLike;
  countervaluesState: CounterValuesState;
  /** The user's selected countervalue (fiat) currency, e.g. EUR.
   *  Countervalues are computed from the operation currency (native or token) to this currency. */
  userCounterValueCurrency: Currency;
  /** USD threshold below which an incoming or outgoing operation is considered dust.
   *  Defaults to MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD ($0.5).
   *  Callers provide their product-specific dust-filter threshold. */
  thresholdUsd?: number;
}): boolean {
  if (operation.type !== "IN" && operation.type !== "OUT") return false;

  if (operation.value.isZero()) return true;

  const operationCurrency = getAccountCurrency(account);

  const rawOpFiatValue = calculate(countervaluesState, {
    from: operationCurrency,
    to: userCounterValueCurrency,
    value: operation.value.toNumber(),
    disableRounding: true,
  });

  if (typeof rawOpFiatValue !== "number" || !Number.isFinite(rawOpFiatValue)) return false;

  const thresholdFiatMinorUnit = convertThresholdFromUsdToCountervalueMinorUnit({
    counterValueCurrency: userCounterValueCurrency,
    countervaluesState,
    thresholdUsd,
  });

  if (!thresholdFiatMinorUnit || thresholdFiatMinorUnit.isZero()) return false;

  return new BigNumber(rawOpFiatValue).lt(thresholdFiatMinorUnit);
}
