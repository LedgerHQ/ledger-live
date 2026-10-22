import { useMemo } from "react";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import {
  pairMarketsWithRequestedLedgerIds,
  useGetMarketsByLedgerIdsQuery,
} from "../state-manager/api";
import { applyUsdRateToMarketItem } from "../utils/applyUsdRateToMarket";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "../utils/timers";
import { useResolveMarketCounterCurrency } from "./useResolveMarketCounterCurrency";

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
    displayCounterCurrency = counterCurrency,
    needsUsdFallback,
    isResolutionLoading,
  } = useResolveMarketCounterCurrency({
    counterCurrency,
    fallbackForCryptoCountervalues: true,
    isCryptoCountervalue,
  });
  const skip = ledgerIds.length === 0 || isResolutionLoading || !requestCounterCurrency;

  const { currentData, isLoading, isError } = useGetMarketsByLedgerIdsQuery(
    { ledgerIds, counterCurrency: requestCounterCurrency ?? counterCurrency },
    {
      skip,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );
  const { rate: usdToCounterValueRate, status: rateStatus } = useUsdToFiatRate(
    needsUsdFallback ? displayCounterCurrency : "usd",
    { skip },
  );

  const rate = needsUsdFallback ? usdToCounterValueRate : 1;
  const markets = useMemo(() => {
    if (rate == null || !currentData) return [];
    return pairMarketsWithRequestedLedgerIds(
      currentData.map(market => applyUsdRateToMarketItem(market, rate)),
      ledgerIds,
    );
  }, [currentData, ledgerIds, rate]);

  return {
    markets,
    isLoading: isLoading || isResolutionLoading || (needsUsdFallback && rateStatus === "loading"),
    isError: isError || (needsUsdFallback && rateStatus === "error"),
  };
};
