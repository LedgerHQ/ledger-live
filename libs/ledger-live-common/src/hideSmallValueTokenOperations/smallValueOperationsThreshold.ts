import BigNumber from "bignumber.js";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { getFiatCurrencyByTicker } from "../currencies";
import type { Currency } from "@ledgerhq/types-cryptoassets";
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

  return new BigNumber(rawCountervalueMinorUnit).decimalPlaces(0, BigNumber.ROUND_FLOOR);
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
 * Returns `true` when an incoming token operation should be hidden as a
 * "small-value" (dust) transaction.
 *
 * An operation is considered dust when:
 * - it belongs to a TokenAccount, AND
 * - its type is "IN" (incoming transfer), AND
 * - either its crypto value is exactly zero, OR its fiat countervalue is
 *   strictly below the configured threshold (defaults to $0.5, overridable
 *   via ff).
 *
 * When the fiat countervalue cannot be computed (e.g. price feed unavailable),
 * the operation is NOT filtered so that legitimate transactions are never
 * accidentally hidden.
 *
 * The comparison is performed in the user's countervalue currency space:
 * we convert the operation amount (token minor units) to user-fiat minor
 * units via the stored `{from: token, to: user_fiat}` countervalue pair,
 * then compare against the threshold expressed in the same units.
 *
 * The countervalues state only stores `{from: token, to: user_fiat}` pairs
 * (never `{from: USD, to: token}`), so the threshold is expressed directly
 * in user_fiat minor units as `floor(thresholdUsd × 10^user_fiat.magnitude)`.
 * This is a ~1:1 USD/fiat approximation that is acceptable for a dust filter.
 */
export function isSmallValueTokenOperation({
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
   *  The countervalues state stores `{from: token, to: this currency}` pairs. */
  userCounterValueCurrency: Currency;
  /** USD threshold below which an incoming token operation is considered dust.
   *  Defaults to MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD ($0.5).
   *  Pass the value from the `lldHideSmallValueTokenOperations` feature flag */
  thresholdUsd?: number;
}): boolean {
  if (account.type !== "TokenAccount" || operation.type !== "IN") return false;

  if (operation.value.isZero()) return true;

  const rawOpFiatValue = calculate(countervaluesState, {
    from: account.token,
    to: userCounterValueCurrency,
    value: operation.value.toNumber(),
    disableRounding: true,
  });

  if (typeof rawOpFiatValue !== "number" || !Number.isFinite(rawOpFiatValue)) return false;

  const thresholdFiatMinorUnit = floorThresholdToCurrencyMinorUnit(
    clampSmallValueThresholdUsd(thresholdUsd, 0),
    userCounterValueCurrency,
  );

  if (!thresholdFiatMinorUnit || thresholdFiatMinorUnit.isZero()) return false;

  return new BigNumber(rawOpFiatValue).lt(thresholdFiatMinorUnit);
}
