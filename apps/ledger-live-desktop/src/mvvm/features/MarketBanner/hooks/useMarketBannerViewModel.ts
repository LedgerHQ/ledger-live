import { useMemo } from "react";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { MARKET_BANNER_ITEMS_COUNT } from "../utils/constants";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { filterMarketPerformersByAvailability } from "@ledgerhq/live-common/market/utils/index";
import {
  MARKET_BANNER_TOP,
  MARKET_BANNER_DATA_SORT_ORDER,
  MARKET_BANNER_REFRESH_RATE,
  MARKET_PERFORMERS_SUPPORTED,
  TIME_RANGE,
} from "@ledgerhq/live-common/market/constants";

export const useMarketBannerViewModel = () => {
  const countervalue = useSelector(counterValueCurrencySelector);
  const { isCurrencyAvailable } = useRampCatalog();

  const { data: currenciesForSwapAll } = useFetchCurrencyAll();
  const currenciesForSwapAllSet = useMemo(
    () => new Set(currenciesForSwapAll ?? []),
    [currenciesForSwapAll],
  );

  const { data, isError, isLoading, isFetching } = useMarketPerformers({
    sort: MARKET_BANNER_DATA_SORT_ORDER,
    counterCurrency: countervalue.ticker,
    range: TIME_RANGE,
    limit: MARKET_BANNER_TOP,
    top: MARKET_BANNER_TOP,
    supported: MARKET_PERFORMERS_SUPPORTED,
    refreshRate: MARKET_BANNER_REFRESH_RATE,
  });

  const filteredItems = useMemo(() => {
    if (!data) return [];

    return filterMarketPerformersByAvailability(
      data,
      isCurrencyAvailable,
      currenciesForSwapAllSet,
      MARKET_BANNER_ITEMS_COUNT,
    );
  }, [data, isCurrencyAvailable, currenciesForSwapAllSet]);

  return {
    data: filteredItems,
    isError: isError && !isFetching,
    isLoading: isLoading || (isFetching && !data),
  };
};
