import React, { useCallback, useContext } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Platform, RefreshControl, FlatList } from "react-native";
import TabBarSafeAreaView, { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import { CurrencyData, MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { useFocusEffect } from "@react-navigation/native";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import { useTranslation } from "react-i18next";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useTheme } from "styled-components/native";
import SearchHeader from "./components/SearchHeader";
import ListFooter from "./components/ListFooter";
import ListEmpty from "./components/ListEmpty";
import ListRow from "./components/ListRow";
import BottomSectionCont from "./components/BottomSection/BottomSectionCont";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import usePullToRefresh from "../../hooks/usePullToRefresh";

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(
  CollapsibleHeaderFlatList<CurrencyData>,
  {
    progressViewOffset: Platform.OS === "android" ? 64 : 0,
  },
);

const keyExtractor = (item: CurrencyData, index: number) => item.id + index;

interface MarketListProps {
  marketData?: CurrencyData[];
  filterByStarredAccount: boolean;
  starredMarketCoins: string[];
  search?: string;
  loading: boolean;
  refresh: (param?: MarketListRequestParams) => void;
  counterCurrency?: string;
  range?: string;
  selectCurrency: (id?: string, data?: CurrencyData, range?: string) => void;
  isLoading: boolean;
  onEndReached: () => Promise<void> | undefined;
}
function MarketList({
  marketData,
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
}: MarketListProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const ptxEarnFF = useFeature("ptxEarn");
  const { handlePullToRefresh, refreshControlVisible } = usePullToRefresh({ loading, refresh });

  const resetSearch = useCallback(
    () =>
      refresh({
        search: "",
        starred: [],
        liveCompatible: false,
        top100: false,
        limit: 20,
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

  const listProps = {
    contentContainerStyle: {
      paddingHorizontal: 16,
      paddingBottom: TAB_BAR_SAFE_HEIGHT,
    },
    data: marketData,
    renderItem: ({ item, index }: { item: CurrencyData; index: number }) => (
      <ListRow
        item={item}
        index={index}
        counterCurrency={counterCurrency}
        range={range}
        selectCurrency={selectCurrency}
      />
    ),
    onEndReached,
    onEndReachedThreshold: 0.5,
    scrollEventThrottle: 50,
    initialNumToRender: 50,
    keyExtractor,
    ListFooterComponent: <ListFooter isLoading={isLoading} />,
    ListEmptyComponent: (
      <ListEmpty
        hasNoSearchResult={Boolean(marketData?.length === 0 && search && !loading)}
        hasEmptyStarredCoins={filterByStarredAccount && starredMarketCoins.length <= 0}
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
  if (!ptxEarnFF?.enabled) {
    return (
      <TabBarSafeAreaView>
        <Flex px={6} pt={ptxEarnFF?.enabled ? 6 : 0}>
          <Text my={3} variant="h4" fontWeight="semiBold">
            {t("market.title")}
          </Text>
          <SearchHeader search={search} refresh={refresh} />
          <BottomSectionCont />
        </Flex>
        <FlatList {...listProps} />
      </TabBarSafeAreaView>
    );
  }

  return (
    <RefreshableCollapsibleHeaderFlatList
      {...listProps}
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <WalletTabSafeAreaView edges={["left", "right"]}>
          <Flex backgroundColor={colors.background.main}>
            <SearchHeader search={search} refresh={refresh} />
            <BottomSectionCont />
          </Flex>
        </WalletTabSafeAreaView>
      }
    />
  );
}
export default MarketList;
