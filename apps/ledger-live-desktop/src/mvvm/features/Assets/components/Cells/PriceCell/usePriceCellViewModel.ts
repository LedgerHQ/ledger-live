import { Currency } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { usePrice } from "~/renderer/hooks/usePrice";

export function usePriceCellViewModel(currency: Currency) {
  const { counterValue, counterValueCurrency } = usePrice(currency);

  if (!counterValue || counterValue.isZero()) {
    return { formattedPrice: "-" };
  }

  const subMagnitude = counterValue.lt(1) ? 1 : 0;
  const formattedPrice = formatCurrencyUnit(counterValueCurrency.units[0], counterValue, {
    showCode: true,
    disableRounding: !!subMagnitude,
    subMagnitude,
  });

  return { formattedPrice };
}
