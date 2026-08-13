import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import {
  aggregatePayCardBalance,
  type FormattedValue,
  type PayCardBalanceData,
  type PayCardBalanceFilterOption,
} from "@features/flow-pay-card-balance";
import {
  PAY_CARD_BALANCE_FILTER_ALL,
  selectPayCardBalanceFilter,
  setPayCardBalanceFilter,
  type PayCardBalanceFilter,
} from "@domain/entity-pay-card";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export function usePayCardBalance(): PayCardBalanceData {
  const dispatch = useDispatch();
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

  // "all" plus one row per held stablecoin, so a currencyId filter resolves instead of falling back to "all".
  const filterOptions = useMemo<PayCardBalanceFilterOption[]>(
    () => [
      {
        id: PAY_CARD_BALANCE_FILTER_ALL,
        title: t("payTab.balance.filter.allStablecoins"),
        countervalue: 0,
        countervalueLabel: "",
      },
      ...categorizedAssets.stablecoins.map(({ currency, value }) => ({
        id: currency.id,
        title: currency.name,
        ticker: currency.ticker,
        ledgerId: currency.id,
        countervalue: value,
        countervalueLabel: formatCurrencyUnit(unit, new BigNumber(value), {
          locale,
          showCode: true,
        }),
      })),
    ],
    [categorizedAssets.stablecoins, t, unit, locale],
  );

  const onConfirmFilter = useCallback(
    (next: PayCardBalanceFilter) => {
      dispatch(setPayCardBalanceFilter(next));
    },
    [dispatch],
  );

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
