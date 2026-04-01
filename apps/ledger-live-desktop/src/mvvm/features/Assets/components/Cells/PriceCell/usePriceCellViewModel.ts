import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { usePrice } from "~/renderer/hooks/usePrice";
import { useOnDemandCurrencyCountervalues } from "~/renderer/actions/deprecated/ondemand-countervalues";

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

  useOnDemandCurrencyCountervalues(currency, counterValueCurrency);

  if (counterValue) {
    return { formattedPrice: formatPrice(unit, counterValue) };
  }

  if (placeholderPrice != null) {
    const value = new BigNumber(placeholderPrice).times(10 ** unit.magnitude);
    return { formattedPrice: formatPrice(unit, value) };
  }

  return { formattedPrice: "-" };
}
