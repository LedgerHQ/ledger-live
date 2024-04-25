import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { ScreenName } from "~/const";
import { useRoute } from "@react-navigation/native";
import { useMarketData as useMarketDataHook } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { setMarketCurrentPage, setMarketRequestParams } from "~/actions/market";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useMarket } from "../../hooks/useMarket";
import { getCurrentPage, isDataStale } from "../../utils";
import { ViewToken } from "react-native";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketList>
>;

export const REFETCH_TIME_ONE_MINUTE = 60 * 1000;

export const BASIC_REFETCH = 3; // nb minutes

export const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 72,
};

function useMarketListViewModel() {
  const llmRefreshMarketDataFeature = useFeature("llmRefreshMarketData");
  const { params } = useRoute<NavigationProps["route"]>();

  const REFRESH_RATE =
    Number(llmRefreshMarketDataFeature?.params?.refreshTime) > 0
      ? REFETCH_TIME_ONE_MINUTE * Number(llmRefreshMarketDataFeature?.params?.refreshTime)
      : REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;

  const initialTop100 = params?.top100;

  const dispatch = useDispatch();

  const {
    marketParams,
    starredMarketCoins,
    supportedCurrencies,
    filterByStarredCurrencies,
    liveCoinsList,
    marketCurrentPage,
    refresh,
  } = useMarket();

  const { search, counterCurrency, range } = marketParams;

  const marketResult = useMarketDataHook({
    ...marketParams,
    liveCoinsList,
    supportedCoinsList: supportedCurrencies,
    starred: filterByStarredCurrencies ? starredMarketCoins : [],
  });

  const marketDataFiltered = filterByStarredCurrencies
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

  const onEndReached = useCallback(() => {
    dispatch(setMarketRequestParams({ page: (marketParams?.page || 1) + 1 }));
  }, [dispatch, marketParams?.page]);

  /**
   *
   * Refresh mechanism ----------------------------------------------
   */

  const refetchData = useCallback(
    (pageToRefetch: number) => {
      const elem = marketResult.cachedMetadataMap.get(String(pageToRefetch ?? 1));

      if (elem && isDataStale(elem.updatedAt, REFRESH_RATE)) {
        elem.refetch();
      }
    },
    [marketResult.cachedMetadataMap, REFRESH_RATE],
  );

  const checkIfDataIsStaleAndRefetch = useCallback(
    (scrollPosition: number) => {
      const newCurrentPage = getCurrentPage(scrollPosition, marketParams.limit || 50);

      if (marketCurrentPage !== newCurrentPage) {
        dispatch(setMarketCurrentPage(newCurrentPage));
      }

      refetchData(newCurrentPage);
    },
    [marketParams.limit, marketCurrentPage, refetchData, dispatch],
  );

  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const lastVisible = viewableItems.map((elem: ViewToken) => elem.index).at(-1);
    if (lastVisible) {
      checkIfDataIsStaleAndRefetch(Number(lastVisible) + 1 ?? 0);
    }
  };
  const viewabilityConfigCallbackPairs = useRef([{ onViewableItemsChanged, viewabilityConfig }]);

  return {
    marketData: marketDataFiltered,
    filterByStarredCurrencies,
    starredMarketCoins,
    search,
    loading: marketResult.isLoading,
    refresh,
    counterCurrency,
    range,
    onEndReached,
    refetchData,
    refreshRate: REFRESH_RATE,
    marketCurrentPage,
    checkIfDataIsStaleAndRefetch,
    viewabilityConfigCallbackPairs,
  };
}

export default useMarketListViewModel;
