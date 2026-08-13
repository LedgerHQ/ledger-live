import { useCallback, useEffect, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import {
  aggregatePayCardBalance,
  buildBalanceFilterOptions,
  resolveSelection,
  tickerForFilter,
  type FormattedValue,
  type PayCardBalanceData,
} from "@features/flow-pay-card-balance";
import {
  PAY_CARD_BALANCE_FILTER_ALL,
  selectPayCardBalanceFilter,
  setPayCardBalanceFilter,
  type PayCardBalanceFilter,
} from "@domain/entity-pay-card";
import type { Unit } from "@domain/entity-currency-unit";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { usePayStablecoins } from "./usePayStablecoins";

export function usePayCardBalance(): PayCardBalanceData {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const filter = useSelector(selectPayCardBalanceFilter);

  const { stablecoins, defaultStablecoins, isLoading, isError } = usePayStablecoins();

  const formatFiat = useCallback(
    (value: number): string =>
      formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [counterValueCurrency, locale],
  );

  const formatCrypto = useCallback(
    (unit: Unit, balance: number): string =>
      formatCurrencyUnit(unit, new BigNumber(balance), { locale, showCode: true }),
    [locale],
  );

  const filterOptions = useMemo(
    () =>
      buildBalanceFilterOptions({
        stablecoins,
        defaultStablecoins,
        allLabel: t("payTab.balance.filter.allStablecoins"),
        formatFiat,
        formatCrypto,
      }),
    [stablecoins, defaultStablecoins, t, formatFiat, formatCrypto],
  );

  const effectiveFilter = useMemo(
    () =>
      resolveSelection(
        filter,
        filterOptions.map(option => option.id),
      ),
    [filter, filterOptions],
  );

  // Heal a stale persisted selection once data is ready.
  useEffect(() => {
    if (!isLoading && !isError && effectiveFilter !== filter) {
      dispatch(setPayCardBalanceFilter(PAY_CARD_BALANCE_FILTER_ALL));
    }
  }, [isLoading, isError, effectiveFilter, filter, dispatch]);

  // Defaults (USDC/USDT) are keyed by market id; held rows may use a different currencyId.
  // Match by ticker so the filtered total stays correct across those ids.
  const stablecoinsForAggregate = useMemo(() => {
    if (effectiveFilter === PAY_CARD_BALANCE_FILTER_ALL) {
      return stablecoins;
    }
    const ticker = tickerForFilter(effectiveFilter, filterOptions);
    if (ticker == null) {
      return stablecoins.filter(({ currency }) => currency.id === effectiveFilter);
    }
    return stablecoins.filter(
      ({ currency }) => currency.ticker.toUpperCase() === ticker.toUpperCase(),
    );
  }, [stablecoins, effectiveFilter, filterOptions]);

  const unit = counterValueCurrency.units[0];

  const formatCountervalue = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [unit, locale],
  );

  const onConfirmFilter = useCallback(
    (next: PayCardBalanceFilter) => {
      dispatch(setPayCardBalanceFilter(next));
    },
    [dispatch],
  );

  const onTrackEvent = useCallback((event: string, params: Record<string, unknown>) => {
    track(event, params);
  }, []);

  return useMemo(() => {
    const aggregate = aggregatePayCardBalance({
      // Pre-filtered by ticker/id; aggregate with "all" so it sums the prepared list.
      stablecoins: stablecoinsForAggregate,
      filter: PAY_CARD_BALANCE_FILTER_ALL,
      isLoading,
      isError,
      filterOptions,
      formatCountervalue,
      onConfirmFilter,
      onTrackEvent,
    });

    return {
      ...aggregate,
      // Keep the resolved selection for the UI (not the "all" forced into aggregate).
      filter: effectiveFilter,
      // Funded vs empty depends on any held stablecoin, not the active filter slice.
      hasBalance: stablecoins.some(({ value }) => value > 0),
    };
  }, [
    stablecoinsForAggregate,
    isLoading,
    isError,
    formatCountervalue,
    effectiveFilter,
    stablecoins,
    filterOptions,
    onConfirmFilter,
    onTrackEvent,
  ]);
}
