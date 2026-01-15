import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import {
  MARKET_BANNER_ITEMS_COUNT,
  MARKET_BANNER_DATA_SORT_ORDER,
  MARKET_BANNER_REFRESH_RATE,
  MARKET_PERFORMERS_SUPPORTED,
} from "../utils/constants";

export const useMarketBannerViewModel = () => {
  const timeRange = useSelector(selectedTimeRangeSelector);
  const countervalue = useSelector(counterValueCurrencySelector);

  const { data, isError, isLoading } = useMarketPerformers({
    sort: MARKET_BANNER_DATA_SORT_ORDER,
    counterCurrency: countervalue.ticker,
    range: timeRange,
    limit: MARKET_BANNER_ITEMS_COUNT,
    top: MARKET_BANNER_ITEMS_COUNT,
    supported: MARKET_PERFORMERS_SUPPORTED,
    refreshRate: MARKET_BANNER_REFRESH_RATE,
  });

  return { data, isError, isLoading };
};
