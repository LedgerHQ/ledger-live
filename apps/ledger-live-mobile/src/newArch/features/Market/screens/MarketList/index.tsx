import React, { MutableRefObject, useCallback, useContext, useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { Platform, RefreshControl, ViewToken } from "react-native";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import { CurrencyData, MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
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
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import useMarketListViewModel from "./useMarketListViewModel";
import { LIMIT } from "~/reducers/market";

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(
  CollapsibleHeaderFlatList<CurrencyData>,
  {
    progressViewOffset: Platform.OS === "android" ? 64 : 0,
  },
);

const keyExtractor = (item: CurrencyData, index: number) => item.id + index;

interface ViewProps {
  marketData?: CurrencyData[];
  filterByStarredCurrencies: boolean;
  starredMarketCoins: string[];
  search?: string;
  loading: boolean;
  refresh: (param?: MarketListRequestParams) => void;
  counterCurrency?: string;
  range?: string;
  onEndReached?: () => void;
  refetchData: (pageToRefetch: number) => void;
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
  refresh,
  counterCurrency,
  range,
  onEndReached,
  refreshRate,
  marketCurrentPage,
  refetchData,
  viewabilityConfigCallbackPairs,
  resetMarketPageToInital,
  marketParams,
}: ViewProps) {
  const { colors } = useTheme();
  const { handlePullToRefresh, refreshControlVisible } = usePullToRefresh({ loading, refresh });

  const resetSearch = useCallback(
    () =>
      refresh({
        search: "",
        starred: [],
        liveCompatible: false,
        limit: LIMIT,
      }),
    [refresh],
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
      paddingBottom: TAB_BAR_SAFE_HEIGHT,
    },
    data: marketData,
    renderItem: ({ item, index }: { item: CurrencyData; index: number }) => (
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
    <RefreshableCollapsibleHeaderFlatList
      {...listProps}
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <WalletTabSafeAreaView edges={["left", "right"]}>
          <Flex backgroundColor={colors.background.main}>
            <SearchHeader search={search} refresh={refresh} />
            <BottomSection />
          </Flex>
        </WalletTabSafeAreaView>
      }
    />
  );
}

const MarketList = () => <View {...useMarketListViewModel()} />;

export default MarketList;
