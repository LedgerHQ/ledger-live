import React, { MutableRefObject, useCallback, useContext, useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { RefreshControl, ViewToken } from "react-native";
import {
  MarketCurrencyData,
  MarketListRequestParams,
} from "@ledgerhq/live-common/market/utils/types";
import { useFocusEffect } from "@react-navigation/native";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import { useTheme } from "styled-components/native";
import SearchHeader from "./components/SearchHeader";
import ListFooter from "./components/ListFooter";
import ListEmpty from "./components/ListEmpty";
import ListRow from "./components/ListRow";
import BottomSection from "./components/BottomSection";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import useMarketListViewModel from "./useMarketListViewModel";
import { LIMIT } from "~/reducers/market";
import { DdRum } from "@datadog/mobile-react-native";
import { ScreenName } from "~/const";
import { MARKET_LIST_VIEW_ID } from "~/utils/constants";
import { buildFeatureFlagTags } from "~/utils/datadogUtils";

const keyExtractor = (item: MarketCurrencyData, index: number) => item.id + index;

interface ViewProps {
  marketData?: MarketCurrencyData[];
  filterByStarredCurrencies: boolean;
  starredMarketCoins: string[];
  search?: string;
  loading: boolean;
  updateMarketParams: (param?: MarketListRequestParams) => void;
  counterCurrency?: string;
  range?: string;
  onEndReached?: () => void;
  refetchData: (pageToRefetch: number) => void;
  refetchAllPages: () => void;
  resetMarketPageToInital: (page: number) => void;
  refreshRate: number;
  marketParams: MarketListRequestParams;
  marketCurrentPage: number;
  viewabilityConfigCallbackPairs: MutableRefObject<
    {
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => void;
      viewabilityConfig: {
        viewAreaCoveragePercentThreshold: number;
      };
    }[]
  >;
}
function View({
  marketData,
  filterByStarredCurrencies,
  starredMarketCoins,
  search,
  loading,
  updateMarketParams,
  counterCurrency,
  range,
  onEndReached,
  refreshRate,
  marketCurrentPage,
  refetchData,
  refetchAllPages,
  viewabilityConfigCallbackPairs,
  resetMarketPageToInital,
  marketParams,
}: ViewProps) {
  const { colors } = useTheme();
  const { handlePullToRefresh, refreshControlVisible } = usePullToRefresh({
    loading,
    refetch: refetchAllPages,
  });

  const resetSearch = useCallback(
    () =>
      updateMarketParams({
        search: "",
        starred: [],
        liveCompatible: false,
        limit: LIMIT,
      }),
    [updateMarketParams],
  );

  const { setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen && setScreen("Market");

      return () => {
        setSource("Market");
      };
    }, [setScreen, setSource]),
  );

  /**
   * Reset the page to 1 when the component mounts to only refetch first page
   * */
  useEffect(() => {
    resetMarketPageToInital(marketParams.page ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    DdRum.startView(MARKET_LIST_VIEW_ID, ScreenName.MarketList, {
      featureFlags: buildFeatureFlagTags(),
    });
    DdRum.addViewLoadingTime(true);
  }, []);
  /**
   * Try to Refetch data every REFRESH_RATE time
   */
  useEffect(() => {
    const intervalId = setInterval(() => refetchData(marketCurrentPage ?? 1), refreshRate);

    return () => clearInterval(intervalId);
  }, [marketCurrentPage, refetchData, refreshRate]);

  const listProps = {
    contentContainerStyle: {
      paddingHorizontal: 16,
    },
    data: marketData,
    renderItem: ({ item, index }: { item: MarketCurrencyData; index: number }) => (
      <ListRow item={item} index={index} counterCurrency={counterCurrency} range={range} />
    ),
    onEndReached,
    maxToRenderPerBatch: 50,
    onEndReachedThreshold: 0.5,
    scrollEventThrottle: 50,
    initialNumToRender: 50,
    keyExtractor,
    viewabilityConfigCallbackPairs: viewabilityConfigCallbackPairs.current,
    ListFooterComponent: <ListFooter isLoading={loading} />,
    ListEmptyComponent: (
      <ListEmpty
        hasNoSearchResult={Boolean(marketData?.length === 0 && search && !loading)}
        hasEmptyStarredCoins={filterByStarredCurrencies && starredMarketCoins.length <= 0}
        search={search}
        resetSearch={resetSearch}
        isLoading={loading}
      />
    ),
    refreshControl: (
      <RefreshControl
        refreshing={refreshControlVisible}
        colors={[colors.primary.c80]}
        tintColor={colors.primary.c80}
        onRefresh={handlePullToRefresh}
      />
    ),
  };

  return (
    <CollapsibleHeaderFlatList<MarketCurrencyData>
      {...listProps}
      testID="market-list"
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <WalletTabSafeAreaView edges={["left", "right"]}>
          <Flex backgroundColor={colors.background.main}>
            <SearchHeader search={search} updateMarketParams={updateMarketParams} />
            <BottomSection />
          </Flex>
        </WalletTabSafeAreaView>
      }
    />
  );
}

const MarketList = () => <View {...useMarketListViewModel()} />;

export default MarketList;
