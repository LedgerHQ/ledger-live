import type { Currency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  localeSelector,
  discreetModeSelector,
} from "~/renderer/reducers/settings";

export function useCounterValueCellViewModel(
  currency: Currency,
  value: BigNumber | number,
  options?: { date?: Date; alwaysShowSign?: boolean },
) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const numericValue = typeof value === "number" ? value : value.toNumber();

  const counterValue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: numericValue,
    disableRounding: true,
    date: options?.date,
  });

  if (typeof counterValue !== "number") {
    return { formattedCounterValue: "-" };
  }

  const formattedCounterValue = formatCurrencyUnit(
    counterValueCurrency.units[0],
    new BigNumber(counterValue),
    { showCode: true, alwaysShowSign: options?.alwaysShowSign, locale, discreet },
  );

  return { formattedCounterValue };
}
