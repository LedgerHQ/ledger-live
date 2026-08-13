import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import {
  aggregatePayCardBalance,
  type FormattedValue,
  type PayCardBalanceData,
} from "@features/flow-pay-card-balance";
import {
  PAY_CARD_BALANCE_FILTER_ALL,
  selectPayCardBalanceFilter,
  type PayCardBalanceFilter,
} from "@domain/entity-pay-card";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";

export function usePayCardBalance(): PayCardBalanceData {
  const { t } = useTranslation();
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

  // Full filter options / confirm wiring lands with the LWD/LWM filter tasks.
  const filterOptions = useMemo(
    () =>
      [
        {
          id: PAY_CARD_BALANCE_FILTER_ALL,
          title: t("payTab.balance.filter.allStablecoins"),
          countervalue: 0,
          countervalueLabel: "",
        },
      ] as const,
    [t],
  );

  const onConfirmFilter = useCallback((_next: PayCardBalanceFilter) => {}, []);

  return useMemo(
    () =>
      aggregatePayCardBalance({
        stablecoins: categorizedAssets.stablecoins,
        filter,
        isLoading: isLoadingStablecoinTickers,
        isError: isStablecoinTickersError,
        filterOptions,
        formatCountervalue,
        onConfirmFilter,
      }),
    [
      categorizedAssets.stablecoins,
      filter,
      isLoadingStablecoinTickers,
      isStablecoinTickersError,
      filterOptions,
      formatCountervalue,
      onConfirmFilter,
    ],
  );
}
