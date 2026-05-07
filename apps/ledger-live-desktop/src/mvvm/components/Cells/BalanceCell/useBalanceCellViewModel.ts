import type { Currency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector, discreetModeSelector } from "~/renderer/reducers/settings";

export function useBalanceCellViewModel(
  currency: Currency,
  balance: BigNumber | number,
  options?: { alwaysShowSign?: boolean },
) {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const bigNumberBalance = typeof balance === "number" ? new BigNumber(balance) : balance;

  const formattedBalance = formatCurrencyUnit(currency.units[0], bigNumberBalance, {
    showCode: true,
    alwaysShowSign: options?.alwaysShowSign,
    locale,
    discreet,
  });

  return { formattedBalance };
}
