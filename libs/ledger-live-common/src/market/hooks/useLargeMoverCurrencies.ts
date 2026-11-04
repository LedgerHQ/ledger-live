import { useMemo } from "react";
import {
  pairMarketsWithRequestedLedgerIds,
  useGetMarketsByLedgerIdsQuery,
} from "../state-manager/api";
import { applyUsdRateToMarketItem } from "../utils/applyUsdRateToMarket";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "../utils/timers";
import { useMarketCounterValueRate } from "./useMarketCounterValueRate";

type UseLargeMoverCurrenciesParams = {
  ledgerIds: string[];
  counterCurrency: string;
  isCryptoCountervalue: boolean;
};

export const useLargeMoverCurrencies = ({
  ledgerIds,
  counterCurrency,
  isCryptoCountervalue,
}: UseLargeMoverCurrenciesParams) => {
  const {
    requestCounterCurrency,
    rate,
    isResolutionLoading,
    isLoading: isCounterValueLoading,
    isError: isCounterValueError,
  } = useMarketCounterValueRate({
    counterCurrency,
    fallbackForCryptoCountervalues: true,
    isCryptoCountervalue,
    skip: ledgerIds.length === 0,
  });
  const skip = ledgerIds.length === 0 || isResolutionLoading || !requestCounterCurrency;

  const { currentData, isLoading, isError } = useGetMarketsByLedgerIdsQuery(
    { ledgerIds, counterCurrency: requestCounterCurrency ?? counterCurrency },
    {
      skip,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );
  const markets = useMemo(() => {
    if (rate == null || !currentData) return [];
    return pairMarketsWithRequestedLedgerIds(
      currentData.map(market => applyUsdRateToMarketItem(market, rate)),
      ledgerIds,
    );
  }, [currentData, ledgerIds, rate]);

  return {
    markets,
    isLoading: isLoading || isCounterValueLoading,
    isError: isError || isCounterValueError,
  };
};
