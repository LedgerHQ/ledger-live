import { Currency } from "@ledgerhq/types-cryptoassets";
import { fiatFloatToSmallestUnit, formatFiatPrice } from "LLD/utils/fiatPriceFormat";
import { usePrice } from "~/renderer/hooks/usePrice";

export function usePriceCellViewModel(currency: Currency, placeholderPrice?: number) {
  const { counterValue, counterValueCurrency } = usePrice(currency);
  const unit = counterValueCurrency.units[0];

  if (counterValue) {
    return { formattedPrice: formatFiatPrice(unit, counterValue, { showCode: true }) };
  }

  if (placeholderPrice != null) {
    return {
      formattedPrice: formatFiatPrice(unit, fiatFloatToSmallestUnit(unit, placeholderPrice), {
        showCode: true,
      }),
    };
  }

  return { formattedPrice: "-" };
}
