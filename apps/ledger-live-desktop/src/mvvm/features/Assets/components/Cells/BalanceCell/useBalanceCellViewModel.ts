import { Currency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector, discreetModeSelector } from "~/renderer/reducers/settings";

export function useBalanceCellViewModel(currency: Currency, balance: number) {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const formattedBalance = formatCurrencyUnit(currency.units[0], new BigNumber(balance), {
    showCode: true,
    locale,
    discreet,
  });

  return { formattedBalance };
}
