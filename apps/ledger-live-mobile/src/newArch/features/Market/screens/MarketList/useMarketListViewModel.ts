import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { ScreenName } from "~/const";
import { useRoute } from "@react-navigation/native";
import { useMarketData as useMarketDataHook } from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { setMarketRequestParams } from "~/actions/market";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useMarket } from "../../hooks/useMarket";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketList>
>;

function useMarketListViewModel() {
  const llmRefreshMarketDataFeature = useFeature("llmRefreshMarketData");
  const { params } = useRoute<NavigationProps["route"]>();

  const initialTop100 = params?.top100;

  const dispatch = useDispatch();

  const {
    marketParams,
    starredMarketCoins,
    supportedCurrencies,
    filterByStarredAccount,
    liveCoinsList,
    refresh,
  } = useMarket();

  const { search, counterCurrency, range } = marketParams;

  const marketResult = useMarketDataHook({
    ...marketParams,
    liveCoinsList,
    supportedCoinsList: supportedCurrencies,
    refreshTime: llmRefreshMarketDataFeature?.enabled
      ? Number(llmRefreshMarketDataFeature?.params?.refreshTime)
      : undefined,
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

  const onEndReached = useCallback(() => {
    dispatch(setMarketRequestParams({ page: (marketParams?.page || 1) + 1 }));
  }, [dispatch, marketParams?.page]);

  return {
    marketData: marketDataFiltered,
    filterByStarredAccount,
    starredMarketCoins,
    search,
    loading: marketResult.loading,
    refresh,
    counterCurrency,
    range,
    onEndReached,
  };
}

export default useMarketListViewModel;
