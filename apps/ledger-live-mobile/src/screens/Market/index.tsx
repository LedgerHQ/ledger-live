import React, { useMemo, useCallback, useState, useEffect, useRef, useContext } from "react";
import { useTheme } from "styled-components/native";
import {
  Flex,
  Text,
  ScrollContainerHeader,
  Icon,
  ScrollContainer,
  InfiniteLoader,
  IconsLegacy,
} from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { useMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { Platform, ListRenderItem, RefreshControl, TouchableOpacity, FlatList } from "react-native";
import { CurrencyData, MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { useNetInfo } from "@react-native-community/netinfo";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import {
  marketFilterByStarredAccountsSelector,
  starredMarketCoinsSelector,
} from "~/reducers/settings";
import MarketRowItem from "./MarketRowItem";
import { useLocale } from "~/context/Locale";
import SortBadge, { Badge } from "./SortBadge";
import SearchHeader from "./SearchHeader";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import TrackScreen from "~/analytics/TrackScreen";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import { setMarketFilterByStarredAccounts, setMarketRequestParams } from "~/actions/settings";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import EmptyStarredCoins from "./EmptyStarredCoins";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "~/components/RootNavigator/types/MarketNavigator";
import EmptyState from "./EmptyState";

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(
  CollapsibleHeaderFlatList<CurrencyData>,
  {
    progressViewOffset: Platform.OS === "android" ? 64 : 0,
  },
);

const noResultIllustration = {
  dark: require("~/images/illustration/Dark/_051.png"),
  light: require("~/images/illustration/Light/_051.png"),
};

const noNetworkIllustration = {
  dark: require("~/images/illustration/Dark/_078.png"),
  light: require("~/images/illustration/Light/_078.png"),
};

const keyExtractor = (item: CurrencyData, index: number) => item.id + index;

function getAnalyticsProperties<P extends object>(
  requestParams: MarketListRequestParams,
  otherProperties?: P,
) {
  return {
    ...otherProperties,
    access: false,
    sort: `${requestParams.orderBy}_${requestParams.order}`,
    "%change": requestParams.range,
    countervalue: requestParams.counterCurrency,
    view: requestParams.liveCompatible ? "Only Live Supported" : "All coins",
  };
}

type NavigationProps = BaseComposite<
  StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketList>
>;

const BottomSection = ({ navigation }: { navigation: NavigationProps["navigation"] }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { requestParams, counterCurrency, refresh } = useMarketData();
  const { range, orderBy, order, top100 } = requestParams;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);
  const firstMount = useRef(true); // To known if this is the first mount of the page

  useEffect(() => {
    if (firstMount.current) {
      // We don't want to refresh the market data directly on mount, the data is already refreshed with wanted parameters from MarketDataProviderWrapper
      firstMount.current = false;
      return;
    }
    if (filterByStarredAccount) {
      refresh({ starred: starredMarketCoins });
    } else {
      refresh({ starred: [], search: "" });
    }
  }, [refresh, filterByStarredAccount, starredMarketCoins]);

  const toggleFilterByStarredAccounts = useCallback(() => {
    if (!filterByStarredAccount) {
      track(
        "Page Market Favourites",
        getAnalyticsProperties(requestParams, {
          currencies: starredMarketCoins,
        }),
      );
    }
    dispatch(setMarketFilterByStarredAccounts(!filterByStarredAccount));
  }, [dispatch, filterByStarredAccount, requestParams, starredMarketCoins]);

  const timeRanges = useMemo(
    () =>
      Object.keys(rangeDataTable)
        .filter(key => key !== "1h")
        .map(value => ({
          requestParam: { range: value },
          value,
          label: t(`market.range.${value}`),
        })),
    [t],
  );

  /**
   * Using a normal function as apparently it doesn't use the latest requestParams
   * if using useCallback (even with requestParams in the dependencies)
   * TODO: investigate this for a possible optimization with useCallback
   * */
  const onChange = useCallback(
    (value: unknown) => {
      track(
        "Page Market",
        getAnalyticsProperties({
          ...requestParams,
          ...(value as MarketListRequestParams),
        }),
      );
      dispatch(setMarketRequestParams(value as MarketListRequestParams));
      refresh(value as MarketListRequestParams);
    },
    [dispatch, refresh, requestParams],
  );

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  const overflowX = ScrollContainerHeader.Header.PADDING_HORIZONTAL;

  return (
    <ScrollContainer
      style={{ marginHorizontal: -overflowX, marginTop: 16 }}
      contentContainerStyle={{ paddingHorizontal: overflowX - 6 }}
      height={40}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <TrackScreen category="Page" name={"Market"} access={true} />

      <TouchableOpacity onPress={toggleFilterByStarredAccounts} testID="starred">
        <Badge bg={filterByStarredAccount ? "primary.c80" : "neutral.c30"}>
          <Icon
            name={filterByStarredAccount ? "StarSolid" : "Star"}
            color={filterByStarredAccount ? "background.main" : "neutral.c100"}
          />
        </Badge>
      </TouchableOpacity>

      <SortBadge
        label={t("market.filters.sort")}
        valueLabel={t(
          top100 ? `market.filters.order.topGainers` : `market.filters.order.${orderBy}`,
        )}
        Icon={
          top100
            ? IconsLegacy.GraphGrowMedium
            : order === "asc"
            ? IconsLegacy.ArrowTopMedium
            : IconsLegacy.ArrowBottomMedium
        }
        value={top100 ? "top100" : `${orderBy}_${order}`}
        options={[
          {
            label: t(`market.filters.order.topGainers`),
            requestParam: {
              ids: [],
              starred: [],
              orderBy: "market_cap",
              order: "desc",
              search: "",
              liveCompatible: false,
              sparkline: false,
              top100: true,
            },
            value: "top100",
          },
          {
            label: t(`market.filters.order.${orderBy}_asc`),
            requestParam: {
              order: "asc",
              orderBy: "market_cap",
              top100: false,
              limit: 20,
            },
            value: "market_cap_asc",
          },
          {
            label: t(`market.filters.order.${orderBy}_desc`),
            requestParam: {
              order: "desc",
              orderBy: "market_cap",
              top100: false,
              limit: 20,
            },
            value: "market_cap_desc",
          },
        ]}
        onChange={onChange}
      />
      <SortBadge
        label={t("market.filters.time")}
        value={timeRangeValue?.value}
        valueLabel={timeRangeValue?.label ?? ""}
        options={timeRanges}
        onChange={onChange}
      />

      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ScreenName.MarketCurrencySelect);
        }}
      >
        <Badge>
          <Text fontWeight="semiBold" variant="body">
            {t("market.filters.currency")}
          </Text>
          <Text ml={2} fontWeight="semiBold" variant="body" color="primary.c80" uppercase>
            {counterCurrency}
          </Text>
        </Badge>
      </TouchableOpacity>
    </ScrollContainer>
  );
};

export default function Market({ navigation }: NavigationProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale } = useLocale();
  const { params } = useRoute<NavigationProps["route"]>();
  const initialTop100 = params?.top100;
  const { isConnected } = useNetInfo();
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const filterByStarredAccount: boolean = useSelector(marketFilterByStarredAccountsSelector);
  const ptxEarnFeature = useFeature("ptxEarn");

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

  const marketDataFiltered = filterByStarredAccount
    ? marketData?.filter(d => starredMarketCoins.includes(d.id)) ?? undefined
    : marketData;

  const { limit, search, range, top100 } = requestParams;
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!isConnected) setIsLoading(false);
  }, [isConnected]);

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

  const renderItems: ListRenderItem<CurrencyData> = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        onPress={() => {
          selectCurrency(item.id, item, range);
          navigation.navigate(ScreenName.MarketDetail, {
            currencyId: item.id,
          });
        }}
      >
        <MarketRowItem
          item={item}
          index={index}
          counterCurrency={counterCurrency}
          locale={locale}
          t={t}
        />
      </TouchableOpacity>
    ),
    [counterCurrency, locale, navigation, range, selectCurrency, t],
  );

  const renderEmptyComponent = useCallback(() => {
    if (marketDataFiltered?.length === 0 && search && !loading) {
      // No search results
      return (
        <EmptyState
          illustrationSource={noResultIllustration}
          title={t("market.warnings.noCryptosFound")}
          description={
            <Trans i18nKey="market.warnings.noSearchResultsFor" values={{ search }}>
              <Text fontWeight="bold" variant="body" color="neutral.c70">
                {""}
              </Text>
            </Trans>
          }
          buttonText={t("market.warnings.browseAssets")}
          onButtonClick={resetSearch}
        />
      );
    } else if (!isConnected) {
      // Network down
      return (
        <EmptyState
          illustrationSource={noNetworkIllustration}
          title={t("errors.NetworkDown.title")}
          description={t("errors.NetworkDown.description")}
        />
      );
    } else if (filterByStarredAccount && starredMarketCoins.length <= 0) {
      // Empty starred coins
      return <EmptyStarredCoins />;
    } else {
      // Loading ongoing
      return <InfiniteLoader size={30} />;
    }
  }, [
    marketDataFiltered?.length,
    search,
    loading,
    isConnected,
    filterByStarredAccount,
    starredMarketCoins.length,
    t,
    resetSearch,
  ]);

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
      ?.then(
        () => {
          // do nothing
        },
        () => {
          // do nothing
        },
      )
      .finally(() => setIsLoading(false));
  }, [limit, marketData, page, loading, top100, loadNextPage]);

  const renderFooter = useCallback(
    () => (
      <Flex height={40} mb={6}>
        {isLoading ? <InfiniteLoader size={30} /> : null}
      </Flex>
    ),
    [isLoading],
  );

  const [refreshControlVisible, setRefreshControlVisible] = useState(false);

  const handlePullToRefresh = useCallback(() => {
    refresh();
    setRefreshControlVisible(true);
  }, [refresh, setRefreshControlVisible]);

  useEffect(() => {
    if (refreshControlVisible && !loading) setRefreshControlVisible(false);
  }, [refreshControlVisible, loading]);

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
    data: marketDataFiltered,
    renderItem: renderItems,
    onEndReached: onEndReached,
    onEndReachedThreshold: 0.5,
    scrollEventThrottle: 50,
    initialNumToRender: limit,
    keyExtractor,
    ListFooterComponent: renderFooter,
    ListEmptyComponent: renderEmptyComponent,
    refreshControl: (
      <RefreshControl
        refreshing={refreshControlVisible}
        colors={[colors.primary.c80]}
        tintColor={colors.primary.c80}
        onRefresh={handlePullToRefresh}
      />
    ),
  };

  if (!ptxEarnFeature?.enabled) {
    return (
      <TabBarSafeAreaView>
        <Flex px={6} pt={ptxEarnFeature?.enabled ? 6 : 0}>
          <Text my={3} variant="h4" fontWeight="semiBold">
            {t("market.title")}
          </Text>
          <SearchHeader search={search} refresh={refresh} />
          <BottomSection navigation={navigation} />
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
            <BottomSection navigation={navigation} />
          </Flex>
        </WalletTabSafeAreaView>
      }
    />
  );
}
