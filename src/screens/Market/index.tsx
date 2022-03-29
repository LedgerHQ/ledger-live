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

const BottomSection = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const { requestParams, refresh, counterCurrency } = useMarketData();
  const { range, starred = [], orderBy, order } = requestParams;
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
      refresh({ starred, search: "" });
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
      style={{ marginHorizontal: -overflowX, marginTop: 16 }}
      contentContainerStyle={{ paddingHorizontal: overflowX - Badge.mx }}
      height={40}
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

  const { limit, search, range } = requestParams;
  const [isLoading, setIsLoading] = useState(true);

  const resetSearch = useCallback(
    () => refresh({ search: "", starred: [], liveCompatible: false }),
    [refresh],
  );

  const renderItems = useCallback(
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

  const renderEmptyComponent = useCallback(
    () =>
      search && !isLoading ? (
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
              colors.type === "light"
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
    [colors.type, isLoading, resetSearch, search, t],
  );

  const onEndReached = useCallback(() => {
    if (
      !limit ||
      isNaN(limit) ||
      !marketData ||
      page * limit > marketData.length ||
      loading
    ) {
      setIsLoading(false);
      return Promise.resolve();
    }
    setIsLoading(true);
    return loadNextPage()
      .then(
        () => {
          // do nothing
        },
        () => {
          // do nothing
        },
      )
      .finally(() => setIsLoading(false));
  }, [limit, marketData, page, loading, loadNextPage]);

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

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background.main,
      }}
    >
      <Flex p={6}>
        <Flex
          height={48}
          flexDirection="row"
          justifyContent="flex-start"
          alignItems="center"
        >
          <Text variant="h1">{t("market.title")}</Text>
        </Flex>
        <SearchHeader search={search} refresh={refresh} />
        <BottomSection navigation={navigation} />
      </Flex>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16 }}
        data={marketData}
        renderItem={renderItems}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        scrollEventThrottle={50}
        initialNumToRender={limit}
        keyExtractor={(item, index) => item.id + index}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshControlVisible}
            colors={[colors.primary.c80]}
            tintColor={colors.primary.c80}
            onRefresh={handlePullToRefresh}
          />
        }
      />
    </SafeAreaView>
  );
}
