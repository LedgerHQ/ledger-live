import {
  useCurrencyChartData,
  useCurrencyData,
} from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";

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

  const {
    data: currency,
    isFetching,
    refetch,
  } = useCurrencyData({
    counterCurrency,
    id: currencyId,
  });

  return {
    counterCurrency,
    range,
    currency,
    dataChart: resCurrencyChartData.data,
    loadingChart: resCurrencyChartData.isFetching,
    loading: isFetching,
    marketParams,
    refetch,
  };
};
