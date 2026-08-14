import { useCallback } from "react";
import BigNumber from "bignumber.js";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import {
  usePayCardBalanceData,
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
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { usePayStablecoins } from "./usePayStablecoins";

export function usePayCardBalance(): PayCardBalanceData {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const filter = useSelector(selectPayCardBalanceFilter);

  const { stablecoins, defaultStablecoins, isLoading, isError } = usePayStablecoins();

  const unit = counterValueCurrency.units[0];

  const formatFiat = useCallback(
    (value: number): string =>
      formatCurrencyUnit(unit, new BigNumber(value), { locale, showCode: true }),
    [unit, locale],
  );

  const formatCrypto = useCallback(
    (cryptoUnit: Unit, balance: number): string =>
      formatCurrencyUnit(cryptoUnit, new BigNumber(balance), { locale, showCode: true }),
    [locale],
  );

  const formatCountervalue = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), { locale, showCode: true }),
    [unit, locale],
  );

  const onConfirmFilter = useCallback(
    (next: PayCardBalanceFilter) => {
      dispatch(setPayCardBalanceFilter(next));
    },
    [dispatch],
  );

  const onResetFilter = useCallback(() => {
    dispatch(setPayCardBalanceFilter(PAY_CARD_BALANCE_FILTER_ALL));
  }, [dispatch]);

  const onTrackEvent = useCallback((event: string, params: Record<string, unknown>) => {
    track(event, params);
  }, []);

  return usePayCardBalanceData({
    stablecoins,
    defaultStablecoins,
    filter,
    isLoading,
    isError,
    allLabel: t("payTab.balance.filter.allStablecoins"),
    formatFiat,
    formatCrypto,
    formatCountervalue,
    onConfirmFilter,
    onResetFilter,
    onTrackEvent,
  });
}
