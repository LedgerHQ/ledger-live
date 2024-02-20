import { useCallback, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { ScreenName } from "~/const";
import { useRoute } from "@react-navigation/native";
import {
  marketFilterByStarredAccountsSelector,
  starredMarketCoinsSelector,
} from "~/reducers/settings";
import { useMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketList>
>;

function useMarketListViewModel() {
  const { params } = useRoute<NavigationProps["route"]>();
  const [isLoading, setIsLoading] = useState(true);
  const initialTop100 = params?.top100;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);

  const {
    requestParams,
    refresh,
    counterCurrency,
    marketData,
    loadNextPage,
    loading,
    page,
    selectCurrency,
  } = useMarketData();

  const { limit, search, range, top100 } = requestParams;

  const marketDataFiltered = filterByStarredAccount
    ? marketData?.filter(d => starredMarketCoins.includes(d.id)) ?? undefined
    : marketData;

  useEffect(() => {
    if (initialTop100) {
      refresh({
        limit: 100,
        ids: [],
        starred: [],
        orderBy: "market_cap",
        order: "desc",
        search: "",
        liveCompatible: false,
        sparkline: false,
        top100: true,
      });
    }
  }, [initialTop100, refresh]);

  useEffect(() => {
    if (filterByStarredAccount && starredMarketCoins.length > 0) {
      refresh({ starred: starredMarketCoins });
    }
  }, [refresh, starredMarketCoins, filterByStarredAccount]);

  const onEndReached = useCallback(() => {
    if (
      !limit ||
      isNaN(limit) ||
      !marketData ||
      page * limit > marketData.length ||
      loading ||
      top100
    ) {
      setIsLoading(false);
      return Promise.resolve();
    }
    setIsLoading(true);
    const next = loadNextPage();
    return next
      ?.then(() => {
        // do nothing
      })
      .finally(() => setIsLoading(false));
  }, [limit, marketData, page, loading, top100, loadNextPage]);

  return {
    marketData: marketDataFiltered,
    filterByStarredAccount,
    starredMarketCoins,
    search,
    loading,
    refresh,
    counterCurrency,
    range,
    selectCurrency,
    isLoading,
    onEndReached,
  };
}

export default useMarketListViewModel;
