import {
  useCurrencyChartData,
  useCurrencyData,
} from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";

import { useSelector } from "react-redux";
import { marketParamsSelector } from "~/reducers/market";
import VersionNumber from "react-native-version-number";

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

  const { data: currency, isLoading } = useCurrencyData({
    counterCurrency,
    id: currencyId,
    product: "llm",
    version: VersionNumber.appVersion,
  });

  return {
    counterCurrency,
    range,
    currency,
    dataChart: resCurrencyChartData.data,
    loadingChart: resCurrencyChartData.isLoading,
    loading: isLoading,
    marketParams,
  };
};
