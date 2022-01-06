import React, { useMemo, useCallback, useState } from "react";
import styled, { useTheme } from "styled-components/native";
import {
  Flex,
  Button,
  Text,
  ScrollContainerHeader,
  Icons,
  Icon,
  ScrollContainer,
  InfiniteLoader,
} from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { useMarketData } from "@ledgerhq/live-common/lib/market/MarketDataProvider";
import { rangeDataTable } from "@ledgerhq/live-common/lib/market/utils/rangeDataTable";
import { FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { starredMarketCoinsSelector } from "../../reducers/settings";
import MarketRowItem from "./MarketRowItem";
import { useLocale } from "../../context/Locale";
import SortBadge, { Badge } from "./SortBadge";
import SearchHeader from "./SearchHeader";
import { ScreenName } from "../../const";

export const Main = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${p => p.theme.colors.background.main};
  overflow: hidden;
  width: 100%;
  padding-top: 50px;
`;

const BackButton = ({ navigation }: { navigation: any }) => (
  <Button onPress={() => navigation.goBack()} Icon={Icons.ArrowLeftMedium} />
);

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

  const toggleFilterByStarredAccounts = useCallback(() => {
    if (starredMarketCoins.length > 0) {
      const starred = starFilterOn ? [] : starredMarketCoins;
      refresh({ starred });
    }
  }, [refresh, starFilterOn, starredMarketCoins]);

  const timeRanges = useMemo(
    () =>
      Object.keys(rangeDataTable).map(value => ({
        requestParam: { range: value },
        value,
        label: t(`market.range.${value}`),
      })),
    [t],
  );

  const onChange = useCallback(
    (value: any) => {
      refresh(value);
    },
    [refresh],
  );

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  return (
    <ScrollContainer
      height={55}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {starredMarketCoins.length <= 0 && !starFilterOn ? null : (
        <TouchableOpacity onPress={toggleFilterByStarredAccounts}>
          <Badge>
            <Icon name="Star" color="neutral.c100" />
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
              color="primary.c100"
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
            color="primary.c100"
          >
            {counterCurrency}
          </Text>
        </Badge>
      </TouchableOpacity>
      <SortBadge
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
      />
    </ScrollContainer>
  );
};

export default function Market({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale } = useLocale();
  const {
    requestParams,
    refresh,
    counterCurrency,
    marketData,
    loadNextPage,
    loading,
    page,
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
      <MarketRowItem
        item={item}
        index={index}
        counterCurrency={counterCurrency}
        locale={locale}
        t={t}
      />
    ),
    [counterCurrency, locale, t],
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

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const renderFooter = useCallback(
    () =>
      isLoading ? (
        <Flex py="4">
          <InfiniteLoader size={40} />
        </Flex>
      ) : null,
    [isLoading],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Flex
        flex={1}
        style={{
          position: "relative",
        }}
      >
        <ScrollContainerHeader
          TopLeftSection={<BackButton navigation={navigation} />}
          MiddleSection={
            <Flex
              height={48}
              flexDirection="row"
              justifyContent="flex-start"
              alignItems="center"
              pl={4}
              style={{ zIndex: 1 }}
            >
              <Text variant="h2">{t("market.title")}</Text>
            </Flex>
          }
          TopRightSection={<Button onPress={openSearch} iconName="Search" />}
          BottomSection={
            <BottomSection navigation={navigation} openSearch={openSearch} />
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              colors={[colors.primary.c80]}
              tintColor={colors.primary.c80}
              onRefresh={() => refresh()}
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
