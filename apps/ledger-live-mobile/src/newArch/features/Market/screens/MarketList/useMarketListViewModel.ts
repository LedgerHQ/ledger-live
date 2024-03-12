import { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { ScreenName } from "~/const";
import { useRoute } from "@react-navigation/native";
import { useMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import {
  marketFilterByStarredAccountsSelector,
  marketRequestParamsSelector,
  starredMarketCoinsSelector,
} from "~/reducers/market";

import {
  useMarketDataProvider,
  useMarketData as useMarketDataHook,
} from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { setMarketRequestParams } from "~/actions/market";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketList>
>;

function useMarketListViewModel() {
  const { params } = useRoute<NavigationProps["route"]>();
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const initialTop100 = params?.top100;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);
  const marketParams = useSelector(marketRequestParamsSelector);
  const { counterCurrency, loading, selectCurrency } = useMarketData();

  const refresh = useCallback(
    (payload?: MarketListRequestParams) => {
      dispatch(setMarketRequestParams(payload ?? {}));
    },
    [dispatch],
  );

  const { supportedCurrencies, liveCoinsList } = useMarketDataProvider();

  const { limit, search, range, top100, page } = marketParams;

  const marketResult = useMarketDataHook({
    ...marketParams,
    liveCoinsList,
    supportedCoinsList: supportedCurrencies,
  });

  const marketDataFiltered = filterByStarredAccount
    ? marketResult.data?.filter(d => starredMarketCoins.includes(d.id)) ?? undefined
    : marketResult.data;

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

  const onLoadNextPage = useCallback(() => {
    dispatch(setMarketRequestParams({ page: (marketParams?.page || 1) + 1 }));
  }, [dispatch, marketParams?.page]);

  const onEndReached = useCallback(() => {
    if (
      (!limit || isNaN(limit) || !marketResult.data || page) ??
      (0 * limit > marketResult.data.length || loading || top100)
    ) {
      setIsLoading(false);
      return Promise.resolve();
    }
    setIsLoading(true);
    onLoadNextPage();
  }, [limit, marketResult.data, page, loading, top100, onLoadNextPage]);

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
