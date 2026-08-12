import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import {
  aggregatePayCardBalance,
  type FormattedValue,
  type PayCardBalanceData,
} from "@features/flow-pay-card-balance";
import { selectPayCardBalanceFilter } from "@domain/entity-pay-card";
import { useSelector } from "LLD/hooks/redux";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export function usePayCardBalance(): PayCardBalanceData {
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const filter = useSelector(selectPayCardBalanceFilter);

  const { categorizedAssets, isLoadingStablecoinTickers, isStablecoinTickersError } =
    useCategorizedAssetsFromPortfolio();

  const unit = counterValueCurrency.units[0];

  const formatCountervalue = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [unit, locale],
  );

  return useMemo(
    () =>
      aggregatePayCardBalance({
        stablecoins: categorizedAssets.stablecoins,
        filter,
        isLoading: isLoadingStablecoinTickers,
        isError: isStablecoinTickersError,
        formatCountervalue,
      }),
    [
      categorizedAssets.stablecoins,
      filter,
      isLoadingStablecoinTickers,
      isStablecoinTickersError,
      formatCountervalue,
    ],
  );
}
