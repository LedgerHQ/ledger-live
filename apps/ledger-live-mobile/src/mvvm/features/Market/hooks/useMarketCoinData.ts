import { useMemo } from "react";
import { useCurrencyData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useAssetChartDataInCounterValue } from "@ledgerhq/live-common/market/hooks/useAssetChartDataInCounterValue";
import { useResolveMarketCounterCurrency } from "@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { applyUsdRateToMarket } from "@ledgerhq/live-common/market/utils/applyUsdRateToMarket";

import { useSelector } from "~/context/hooks";
import { marketParamsSelector } from "~/reducers/market";
import { counterValueCurrencySelector } from "~/reducers/settings";

type HookProps = {
  currencyId: string;
};

export const useMarketCoinData = ({ currencyId }: HookProps) => {
  const marketParams = useSelector(marketParamsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const { counterCurrency: settingsCounterCurrency = "usd" } = marketParams;
  const {
    requestCounterCurrency,
    displayCounterCurrency = settingsCounterCurrency,
    needsUsdFallback,
    isResolutionLoading,
  } = useResolveMarketCounterCurrency({
    counterCurrency: settingsCounterCurrency,
    fallbackForCryptoCountervalues: true,
    isCryptoCountervalue: counterValueCurrency.type === "CryptoCurrency",
  });
  const shouldFetchCurrency = !isResolutionLoading;

  const { data, isFetching, refetch } = useCurrencyData(
    {
      counterCurrency: requestCounterCurrency,
      id: currencyId,
    },
    { skip: !shouldFetchCurrency },
  );
  const { rate: usdToCounterValueRate, status: rateStatus } = useUsdToFiatRate(
    needsUsdFallback ? displayCounterCurrency : "usd",
    { skip: !shouldFetchCurrency },
  );

  const rate = needsUsdFallback ? usdToCounterValueRate : 1;
  const currency = useMemo(() => {
    if (isResolutionLoading || rate == null || !data) return undefined;
    return applyUsdRateToMarket(data, rate);
  }, [data, isResolutionLoading, rate]);

  const isRateLoading = needsUsdFallback && rateStatus === "loading";

  return {
    counterCurrency: displayCounterCurrency,
    currency,
    loading: isResolutionLoading || isFetching || isRateLoading,
    refetch,
  };
};

export const useMarketCoinDataWithChart = ({ currencyId }: HookProps) => {
  const marketParams = useSelector(marketParamsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const { counterCurrency = "usd", range = "24h" } = marketParams;

  const { currentData: dataChart, isFetching: loadingChart } = useAssetChartDataInCounterValue({
    counterCurrency,
    id: currencyId,
    range,
    isCryptoCountervalue: counterValueCurrency.type === "CryptoCurrency",
  });

  const { currency, loading, refetch } = useMarketCoinData({ currencyId });

  return {
    counterCurrency,
    range,
    currency,
    dataChart,
    loadingChart,
    loading,
    marketParams,
    refetch,
  };
};
