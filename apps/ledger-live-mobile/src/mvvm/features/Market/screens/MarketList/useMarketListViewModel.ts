import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "~/context/hooks";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "LLM/features/Market/Navigator";
import { ScreenName } from "~/const";
import { useRoute } from "@react-navigation/native";
import { useMarketData as useMarketDataHook } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { toMarketListQueryArg } from "@ledgerhq/live-common/market/utils/marketListQueryArg";
import { resolveMarketListRefreshRate } from "@ledgerhq/live-common/market/utils/timers";
import { setMarketCurrentPage } from "~/actions/market";
import { LIMIT } from "~/reducers/market";
import { useFeature } from "@features/platform-feature-flags";
import { useMarket } from "../../hooks/useMarket";
import { getCurrentPage } from "../../utils";
import { ViewToken } from "react-native";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { useQueryClient } from "@tanstack/react-query";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketList>
>;

export const viewabilityConfig = {
  viewAreaCoveragePercentThreshold: 72,
};

const TOP_MARKET_RESULT_CAP = 100;

function marketListLimit(isTop100Route: boolean | undefined, storedLimit?: number) {
  if (isTop100Route) return TOP_MARKET_RESULT_CAP;
  if (storedLimit === TOP_MARKET_RESULT_CAP) return LIMIT;
  return storedLimit;
}

function useMarketListViewModel() {
  const llmRefreshMarketDataFeature = useFeature("llmRefreshMarketData");
  const { params } = useRoute<NavigationProps["route"]>();
  const queryClient = useQueryClient();

  const REFRESH_RATE = resolveMarketListRefreshRate(
    llmRefreshMarketDataFeature?.params?.refreshTime,
  );

  const initialTop100 = params?.top100;

  const dispatch = useDispatch();

  const {
    marketParams,
    starredMarketCoins,
    filterByStarredCurrencies,
    marketCurrentPage,
    updateMarketParams,
  } = useMarket();

  const { search, counterCurrency, range } = marketParams;

  const shouldDisplayLiveCompatible = marketParams.liveCompatible;
  const listLimit = marketListLimit(initialTop100, marketParams.limit);

  const marketResult = useMarketDataHook(
    {
      ...marketParams,
      limit: listLimit,
      starred: filterByStarredCurrencies ? starredMarketCoins : [],
      liveCompatible: shouldDisplayLiveCompatible,
    },
    { refreshRate: REFRESH_RATE },
  );

  const baseData = filterByStarredCurrencies
    ? (marketResult.data?.filter(d => starredMarketCoins.includes(d.id)) ?? undefined)
    : marketResult.data;

  const marketDataFiltered = baseData
    ? baseData.filter((item, index, arr) => arr.findIndex(i => i.id === item.id) === index)
    : undefined;

  useEffect(() => {
    if (!initialTop100) return;
    updateMarketParams({
      starred: [],
      order: Order.MarketCapDesc,
      search: "",
      liveCompatible: shouldDisplayLiveCompatible,
    });
  }, [initialTop100, updateMarketParams, shouldDisplayLiveCompatible]);

  useEffect(() => {
    if (initialTop100 || marketParams.limit !== TOP_MARKET_RESULT_CAP) return;
    updateMarketParams({ limit: LIMIT });
  }, [initialTop100, marketParams.limit, updateMarketParams]);

  const { fetchNextPage, refetch: refetchMarketList, resetToFirstPage } = marketResult;
  const { pageSize } = toMarketListQueryArg({ ...marketParams, limit: listLimit });

  const refetchAllPages = useCallback(() => {
    refetchMarketList();

    // Also invalidate individual currency data to ensure detail screens show fresh data
    queryClient.invalidateQueries({ queryKey: ["CurrencyDataRaw"] });
    queryClient.invalidateQueries({ queryKey: ["CurrencyChartData"] });
  }, [refetchMarketList, queryClient]);

  const checkIfDataIsStaleAndRefetch = useCallback(
    (indexPosition: number) => {
      const newCurrentPage = getCurrentPage(indexPosition, pageSize);

      if (marketCurrentPage !== newCurrentPage) {
        dispatch(setMarketCurrentPage(newCurrentPage));
      }
    },
    [pageSize, marketCurrentPage, dispatch],
  );

  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const lastVisible = viewableItems.map((elem: ViewToken) => elem.index).at(-1);
    if (lastVisible) {
      checkIfDataIsStaleAndRefetch(Number(lastVisible) + 2);
    }
  };
  const viewabilityConfigCallbackPairs = useRef([{ onViewableItemsChanged, viewabilityConfig }]);

  const resetMarketPage = useCallback(() => {
    resetToFirstPage();
    dispatch(setMarketCurrentPage(1));
  }, [dispatch, resetToFirstPage]);

  return {
    marketData: marketDataFiltered,
    filterByStarredCurrencies,
    starredMarketCoins,
    search,
    loading: marketResult.isLoading || marketResult.isFetchingNextPage,
    refreshing: marketResult.isFetching,
    updateMarketParams,
    counterCurrency,
    range,
    onEndReached: fetchNextPage,
    refetchAllPages,
    checkIfDataIsStaleAndRefetch,
    viewabilityConfigCallbackPairs,
    resetMarketPage,
  };
}

export default useMarketListViewModel;
