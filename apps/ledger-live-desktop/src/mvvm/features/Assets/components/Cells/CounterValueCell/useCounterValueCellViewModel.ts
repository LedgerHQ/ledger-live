import { Currency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  localeSelector,
  discreetModeSelector,
} from "~/renderer/reducers/settings";

export function useCounterValueCellViewModel(currency: Currency, balance: number) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: balance,
    disableRounding: true,
  });

  if (typeof counterValue !== "number") {
    return { formattedCounterValue: "-" };
  }

  const formattedCounterValue = formatCurrencyUnit(
    counterValueCurrency.units[0],
    new BigNumber(counterValue),
    { showCode: true, locale, discreet },
  );

  return { formattedCounterValue };
}
