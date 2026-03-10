import BigNumber from "bignumber.js";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { getFiatCurrencyByTicker } from "../currencies";
import type { Currency } from "@ledgerhq/types-cryptoassets";

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
  const rawCountervalueMinorUnit = calculate(countervaluesState, {
    from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
    to: counterValueCurrency,
    value: new BigNumber(clampSmallValueThresholdUsd(thresholdUsd, 0))
      .times(getMagnitudeFactor(SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY))
      .toNumber(),
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
