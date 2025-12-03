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

  const { counterCurrency = "usd" } = marketParams;

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
    currency,
    loading: isFetching,
    refetch,
  };
};

export const useMarketCoinDataWithChart = ({ currencyId }: HookProps) => {
  const marketParams = useSelector(marketParamsSelector);

  const { counterCurrency = "usd", range = "24h" } = marketParams;

  const { data: dataChart, isFetching: loadingChart } = useCurrencyChartData({
    counterCurrency,
    id: currencyId,
    range,
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
