import { useCallback } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  PAY_CARD_BALANCE_FILTER_ALL,
  selectPayCardBalanceFilter,
  setPayCardBalanceFilter,
  useBalanceData,
  type BalanceData,
  type BalanceFilter,
} from "@features/flow-pay-balance";
import type { Unit } from "@domain/entity-currency-unit";
import { useDispatch, useSelector } from "~/context/hooks";
import { localeSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { usePayStablecoins } from "./usePayStablecoins";
import { useCountervalueFormatter } from "./useCountervalueFormatter";
import { useFiatFormatter } from "./useFiatFormatter";

export function usePayCardBalance(): BalanceData {
  const dispatch = useDispatch();
  const locale = useSelector(localeSelector);
  const filter = useSelector(selectPayCardBalanceFilter);

  const { stablecoins, defaultStablecoins, isLoading, isError } = usePayStablecoins();

  const formatFiat = useFiatFormatter();

  const formatCrypto = useCallback(
    (cryptoUnit: Unit, balance: number): string =>
      formatCurrencyUnit(cryptoUnit, new BigNumber(balance), { locale, showCode: true }),
    [locale],
  );

  const formatCountervalue = useCountervalueFormatter();

  const onConfirmFilter = useCallback(
    (next: BalanceFilter) => {
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

  return useBalanceData({
    stablecoins,
    defaultStablecoins,
    filter,
    isLoading,
    isError,
    formatFiat,
    formatCrypto,
    formatCountervalue,
    onConfirmFilter,
    onResetFilter,
    onTrackEvent,
  });
}
