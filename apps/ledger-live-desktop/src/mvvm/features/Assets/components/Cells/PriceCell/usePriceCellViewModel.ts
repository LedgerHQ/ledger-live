import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { usePrice } from "~/renderer/hooks/usePrice";

function formatPrice(unit: Unit, value: BigNumber): string {
  const subMagnitude = value.lt(10 ** unit.magnitude) ? 1 : 0;
  return formatCurrencyUnit(unit, value, {
    showCode: true,
    disableRounding: !!subMagnitude,
    subMagnitude,
  });
}

export function usePriceCellViewModel(currency: Currency, placeholderPrice?: number) {
  const { counterValue, counterValueCurrency } = usePrice(currency);
  const unit = counterValueCurrency.units[0];

  if (placeholderPrice != null) {
    const value = new BigNumber(placeholderPrice).times(10 ** unit.magnitude);
    return { formattedPrice: formatPrice(unit, value) };
  }

  if (!counterValue) {
    return { formattedPrice: "-" };
  }

  return { formattedPrice: formatPrice(unit, counterValue) };
}
