import { Currency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { usePrice } from "~/renderer/hooks/usePrice";
import { formatPrice } from "@ledgerhq/live-currency-format";

export function usePriceCellViewModel(currency: Currency, marketPrice?: number) {
  const { counterValue, counterValueCurrency } = usePrice(currency);
  const unit = counterValueCurrency.units[0];

  if (marketPrice != null) {
    const value = new BigNumber(marketPrice).times(10 ** unit.magnitude);
    return { formattedPrice: formatPrice(unit, value, { showCode: true }) };
  }

  if (counterValue) {
    return { formattedPrice: formatPrice(unit, counterValue, { showCode: true }) };
  }

  return { formattedPrice: "-" };
}
