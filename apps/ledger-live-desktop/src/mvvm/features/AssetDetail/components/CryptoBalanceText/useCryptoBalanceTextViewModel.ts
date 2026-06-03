import { useMemo } from "react";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import { parseCurrencyUnitFragment } from "LLD/features/AssetDetail/utils/parseCurrencyUnitFragment";
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

  return useMemo(() => {
    const fragment = formatCurrencyUnitFragment(cryptoUnit, new BigNumber(amount), {
      locale,
      discreet,
      showCode: true,
    });
    return parseCurrencyUnitFragment(fragment);
  }, [amount, cryptoUnit, locale, discreet]);
}
