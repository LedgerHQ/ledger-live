/* eslint-disable import/named */
/* eslint-disable import/no-unresolved */

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useTheme } from "styled-components/native";
import {
  Flex,
  Button,
  Text,
  ScrollContainerHeader,
  Icon,
  ScrollContainer,
  InfiniteLoader,
} from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { useMarketData } from "@ledgerhq/live-common/lib/market/MarketDataProvider";
import { rangeDataTable } from "@ledgerhq/live-common/lib/market/utils/rangeDataTable";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MarketListRequestParams } from "@ledgerhq/live-common/lib/market/types";
import { starredMarketCoinsSelector } from "../../reducers/settings";
import MarketRowItem from "./MarketRowItem";
import { useLocale } from "../../context/Locale";
import SortBadge, { Badge } from "./SortBadge";
import SearchHeader from "./SearchHeader";
import { ScreenName } from "../../const";
import { track } from "../../analytics";
import TrackScreen from "../../analytics/TrackScreen";
import { useProviders } from "../Swap/SwapEntry";

function getAnalyticsProperties(
  requestParams: MarketListRequestParams,
  otherProperties?: any,
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

const BottomSection = ({
  navigation,
  openSearch,
}: {
  navigation: any;
  openSearch: () => void;
}) => {
  const { t } = useTranslation();
  const { requestParams, refresh, counterCurrency } = useMarketData();
  const {
    range,
    starred = [],
    liveCompatible,
    orderBy,
    order,
    search,
  } = requestParams;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const starFilterOn = starred.length > 0;

  useEffect(() => {
    if (starFilterOn) {
      refresh({ starred: starredMarketCoins });
    }
  }, [refresh, starFilterOn, starredMarketCoins]);

  const toggleFilterByStarredAccounts = useCallback(() => {
    if (starredMarketCoins.length > 0) {
      const starred = starFilterOn ? [] : starredMarketCoins;
      if (!starFilterOn) {
        track(
          "Page Market Favourites",
          getAnalyticsProperties(requestParams, {
            currencies: starredMarketCoins,
          }),
        );
      }
      refresh({ starred });
    }
  }, [refresh, starFilterOn, starredMarketCoins, requestParams]);

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
  const onChange = (value: any) => {
    track(
      "Page Market",
      getAnalyticsProperties({ ...requestParams, ...value }),
    );
    refresh(value);
  };

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  const overflowX = ScrollContainerHeader.Header.PADDING_HORIZONTAL;

  return (
    <ScrollContainer
      style={{ marginHorizontal: -overflowX }}
      contentContainerStyle={{ paddingHorizontal: overflowX - Badge.mx }}
      height={55}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <TrackScreen category="Page" name={"Market"} access={true} />
      {starredMarketCoins.length <= 0 && !starFilterOn ? null : (
        <TouchableOpacity onPress={toggleFilterByStarredAccounts}>
          <Badge>
            <Icon
              name={starFilterOn ? "StarSolid" : "Star"}
              color="neutral.c100"
            />
          </Badge>
        </TouchableOpacity>
      )}

      {search ? (
        <TouchableOpacity onPress={openSearch}>
          <Badge>
            <Icon name="Search" color="neutral.c100" />
            <Text
              ml={2}
              fontWeight="semiBold"
              variant="body"
              color="primary.c80"
            >
              {search}
            </Text>
          </Badge>
        </TouchableOpacity>
      ) : null}
      <SortBadge
        label={t("market.filters.sort")}
        valueLabel={t(`market.filters.order.${orderBy}`)}
        value={`${orderBy}_${order}`}
        options={[
          {
            label: t(`market.filters.order.${orderBy}_asc`),
            requestParam: { order: "asc", orderBy: "market_cap" },
            value: "market_cap_asc",
          },
          {
            label: t(`market.filters.order.${orderBy}_desc`),
            requestParam: { order: "desc", orderBy: "market_cap" },
            value: "market_cap_desc",
          },
        ]}
        onChange={onChange}
        type="sort"
      />
      <SortBadge
        label={t("market.filters.time")}
        value={timeRangeValue.value}
        valueLabel={timeRangeValue.label}
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
          <Text
            ml={2}
            fontWeight="semiBold"
            variant="body"
            color="primary.c80"
            uppercase
          >
            {counterCurrency}
          </Text>
        </Badge>
      </TouchableOpacity>
      {/* The following is disabled for now as the mapping for supported coins is not 100% working (ERC20 etc.) */}
      {/* <SortBadge
        label={t("market.filters.view.label")}
        value={liveCompatible ? "liveCompatible" : "all"}
        valueLabel={t(
          `market.filters.view.${liveCompatible ? "liveCompatible" : "all"}`,
        )}
        options={[
          {
            label: t(`market.filters.view.all_label`),
            requestParam: { liveCompatible: false },
            value: "all",
          },
          {
            label: t(`market.filters.view.liveCompatible_label`),
            requestParam: { liveCompatible: true },
            value: "liveCompatible",
          },
        ]}
        onChange={onChange}
      /> */}
    </ScrollContainer>
  );
};

export default function Market({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale } = useLocale();

  useProviders();

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

  const { limit, search } = requestParams;
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(!!search);

  const resetSearch = useCallback(
    () => refresh({ search: "", starred: [], liveCompatible: false }),
    [refresh],
  );

  const renderItems = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        onPress={() => {
          selectCurrency(item.id);
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
    [counterCurrency, locale, navigation, selectCurrency, t],
  );

  const renderEmptyComponent = useCallback(
    () =>
      search && !loading ? (
        <Flex
          flex={1}
          flexDirection="column"
          alignItems="stretch"
          p="4"
          mt={70}
        >
          <Image
            style={{ width: 164, height: 164, alignSelf: "center" }}
            source={
              colors.palette.type === "light"
                ? require("../../images/marketNoResultslight.png")
                : require("../../images/marketNoResultsdark.png")
            }
          />
          <Text textAlign="center" variant="h4" my={3}>
            {t("market.warnings.noCryptosFound")}
          </Text>
          <Text textAlign="center" variant="body" color="neutral.c70">
            <Trans
              i18nKey="market.warnings.noSearchResultsFor"
              values={{ search }}
            >
              <Text fontWeight="bold" variant="body" color="neutral.c70">
                {""}
              </Text>
            </Trans>
          </Text>
          <Button mt={8} onPress={resetSearch} type="main">
            {t("market.warnings.browseAssets")}
          </Button>
        </Flex>
      ) : null,
    [loading, resetSearch, search, t],
  );

  const onEndReached = useCallback(async () => {
    if (page * limit > marketData.length) return;
    setIsLoading(true);
    await loadNextPage();
    setIsLoading(false);
  }, [limit, loadNextPage, marketData.length, page]);

  const openSearch = useCallback(() => {
    track("Page Market Search", {
      access: true,
    });
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const renderFooter = useCallback(
    () =>
      isLoading ? (
        <Flex py="4">
          <InfiniteLoader size={40} />
        </Flex>
      ) : (
        <Flex py="4" height={40} />
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      <Flex flex={1} position="relative">
        <ScrollContainerHeader
          bg="background.main"
          MiddleSection={
            <Flex
              height={48}
              flexDirection="row"
              justifyContent="flex-start"
              alignItems="center"
            >
              <Text variant="h2">{t("market.title")}</Text>
            </Flex>
          }
          TopRightSection={
            <Button size="large" onPress={openSearch} iconName="Search" />
          }
          BottomSection={
            <BottomSection navigation={navigation} openSearch={openSearch} />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshControlVisible}
              colors={[colors.primary.c80]}
              tintColor={colors.primary.c80}
              onRefresh={handlePullToRefresh}
            />
          }
        >
          <FlatList
            data={marketData}
            renderItem={renderItems}
            onEndReached={onEndReached}
            onEndReachedThreshold={10}
            scrollEventThrottle={50}
            initialNumToRender={limit}
            keyExtractor={(item, index) => item.id + index}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyComponent}
          />
        </ScrollContainerHeader>

        <SearchHeader
          search={search}
          refresh={refresh}
          isOpen={isSearchOpen}
          onClose={closeSearch}
        />
      </Flex>
    </SafeAreaView>
  );
}
