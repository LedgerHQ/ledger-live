import {
  useCurrencyChartData,
  useCurrencyData,
} from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { marketParamsSelector } from "~/reducers/market";

type HookProps = {
  currencyId: string;
};

export const useMarketCoinData = ({ currencyId }: HookProps) => {
  const marketParams = useSelector(marketParamsSelector);

  const { counterCurrency = "usd", range = "24h" } = marketParams;

  const resCurrencyChartData = useCurrencyChartData({
    counterCurrency,
    id: currencyId,
    range,
  });

  const { currencyData, currencyInfo } = useCurrencyData({
    counterCurrency,
    id: currencyId,
    range,
  });

  const currency = useMemo(() => currencyInfo?.data, [currencyInfo]);
  const isLoadingCurrency = useMemo(() => currencyInfo?.isLoading, [currencyInfo]);

  return {
    counterCurrency,
    range,
    currency,
    dataCurrency: currencyData.data,
    dataChart: resCurrencyChartData.data,
    loadingChart: resCurrencyChartData.isLoading,
    loading: currencyData.isLoading || isLoadingCurrency,
    marketParams,
  };
};
