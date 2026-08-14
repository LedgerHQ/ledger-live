import { useCallback } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import {
  PAY_CARD_BALANCE_FILTER_ALL,
  selectPayCardBalanceFilter,
  setPayCardBalanceFilter,
  usePayCardBalanceData,
  type FormattedValue,
  type PayCardBalanceData,
  type PayCardBalanceFilter,
  type PayCardBalanceLabels,
} from "@features/flow-pay-card-balance";
import type { Unit } from "@domain/entity-currency-unit";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { usePayStablecoins } from "./usePayStablecoins";

export function usePayCardBalance(): PayCardBalanceData & { labels: PayCardBalanceLabels } {
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

  const labels: PayCardBalanceLabels = {
    emptyTitle: t("payTab.balance.emptyTitle"),
    emptyDescription: t("payTab.balance.emptyDescription"),
    allStablecoins: t("payTab.balance.filter.allStablecoins"),
    filterDialogTitle: t("payTab.balance.filter.dialogTitle"),
    filterDialogDescription: t("payTab.balance.filter.dialogDescription"),
    filterDialogBanner: t("payTab.balance.filter.dialogBanner"),
    confirm: t("payTab.balance.filter.confirm"),
  };

  const data = usePayCardBalanceData({
    stablecoins,
    defaultStablecoins,
    filter,
    isLoading,
    isError,
    allLabel: labels.allStablecoins,
    formatFiat,
    formatCrypto,
    formatCountervalue,
    onConfirmFilter,
    onResetFilter,
    onTrackEvent,
  });

  return { ...data, labels };
}
