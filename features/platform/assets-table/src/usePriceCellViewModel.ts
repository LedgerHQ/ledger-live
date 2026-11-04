import type { Currency } from "@domain/entity-currency";
import { useCalculate } from "@features/platform-market-countervalues";
import { BigNumber } from "bignumber.js";
import { useAssetsTablePorts } from "./assetsTablePorts";

export function usePriceCellViewModel(currency: Currency, marketPrice?: number) {
  const { counterValueCurrency, formatPrice } = useAssetsTablePorts();
  const unit = counterValueCurrency.units[0];
  const counterValue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: 10 ** currency.units[0].magnitude,
    disableRounding: true,
  });

  if (marketPrice != null) {
    const value = new BigNumber(marketPrice).times(10 ** unit.magnitude);
    return { formattedPrice: formatPrice(unit, value, { showCode: true }) };
  }

  if (typeof counterValue === "number") {
    return { formattedPrice: formatPrice(unit, new BigNumber(counterValue), { showCode: true }) };
  }

  return { formattedPrice: "-" };
}
