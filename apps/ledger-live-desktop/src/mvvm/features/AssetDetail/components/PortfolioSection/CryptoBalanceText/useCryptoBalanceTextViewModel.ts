import { useMemo } from "react";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector, localeSelector } from "~/renderer/reducers/settings";

type UseCryptoBalanceTextViewModelParams = Readonly<{
  amount: number;
  cryptoUnit: Unit;
}>;

export function useCryptoBalanceTextViewModel({
  amount,
  cryptoUnit,
}: UseCryptoBalanceTextViewModelParams) {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const fragment = useMemo(
    () =>
      formatCurrencyUnitFragment(cryptoUnit, new BigNumber(amount), {
        locale,
        discreet,
        showCode: true,
      }),
    [amount, cryptoUnit, locale, discreet],
  );

  const prefixSymbol =
    fragment.currencyPosition === "start" && fragment.currencyText ? fragment.currencyText : null;
  const suffixSymbol =
    fragment.currencyPosition === "end" && fragment.currencyText ? fragment.currencyText : null;
  const hasDecimals = Boolean(fragment.decimalPart);

  return {
    prefixSymbol,
    suffixSymbol,
    hasDecimals,
    integerPart: fragment.integerPart,
    decimalSeparator: fragment.decimalSeparator,
    decimalPart: fragment.decimalPart,
  };
}
