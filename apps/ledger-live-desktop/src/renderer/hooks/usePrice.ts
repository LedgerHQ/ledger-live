import { useCalculate } from "@ledgerhq/live-countervalues-react/index";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "../reducers/settings";

export const usePrice = (from: Currency, to?: Currency, unit?: Unit, rate?: BigNumber) => {
  const effectiveUnit = unit || from.units[0];
  const valueNum = 10 ** effectiveUnit.magnitude;
  const rawCounterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterValueCurrency = to || rawCounterValueCurrency;
  const rawCounterValue = useCalculate({
    from,
    to: counterValueCurrency,
    value: valueNum,
    disableRounding: true,
  });
  const counterValue = rate
    ? rate.times(valueNum) // NB Allow to override the rate for swap
    : typeof rawCounterValue === "number"
    ? BigNumber(rawCounterValue)
    : rawCounterValue;

  return {
    counterValue,
    effectiveUnit,
    valueNum,
    counterValueCurrency,
  };
};
