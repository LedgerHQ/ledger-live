/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/named */
/* eslint-disable import/no-unresolved */
import React, { useMemo, useCallback, useState, useEffect, memo } from "react";
import { useTheme } from "styled-components/native";
import { Flex, Text, ScrollContainerHeader, Icons } from "@ledgerhq/native-ui";
import { FlatList, Image, RefreshControl } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useSingleCoinMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import { Account } from "@ledgerhq/types-live";
import {
  starredMarketCoinsSelector,
  readOnlyModeEnabledSelector,
} from "../../../reducers/settings";
import { useLocale } from "../../../context/Locale";
import CircleCurrencyIcon from "../../../components/CircleCurrencyIcon";
import { IconContainer } from "../MarketRowItem";
import { counterValueFormatter, getDateFormatter } from "../utils";
import DeltaVariation from "../DeltaVariation";
import {
  addStarredMarketCoins,
  removeStarredMarketCoins,
} from "../../../actions/settings";
import MarketStats from "./MarketStats";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "../../../reducers/accounts";
import AccountRow from "../../Accounts/AccountRow";
import { track, screen } from "../../../analytics";
import Button from "../../../components/wrappedUi/Button";
import MarketGraph from "./MarketGraph";
import { FabMarketActions } from "../../../components/FabActions";
import { ScreenName } from "../../../const";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import { usePreviousRouteName } from "../../../helpers/routeHooks";
import useNotifications from "../../../logic/notifications";

export const BackButton = ({ navigation }: { navigation: any }) => (
  <Button
    size="large"
    onPress={() => navigation.goBack()}
    Icon={Icons.ArrowLeftMedium}
  />
);

function MarketDetail({
  navigation,
  route,
}: {
  navigation: any;
  route: { params: { currencyId: string; resetSearchOnUmount?: boolean } };
}) {
  const { params } = route;
  const { currencyId, resetSearchOnUmount } = params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const isStarred = starredMarketCoins.includes(currencyId);
  const { triggerMarketPushNotificationModal } = useNotifications();

  const {
    selectedCoinData: currency,
    selectCurrency,
    chartRequestParams,
    loading,
    loadingChart,
    refreshChart,
    counterCurrency,
  } = useSingleCoinMarketData();

  const {
    name,
    image,
    price,
    priceChangePercentage,
    internalCurrency,
    chartData,
  } = currency || {};

  useEffect(() => {
    const resetState = () => {
      // selectCurrency();
    };
    const sub = navigation.addListener("blur", resetState);
    return () => {
      sub();
    };
  }, [selectCurrency, resetSearchOnUmount, navigation]);

  const allAccounts = useSelector(
    flattenAccountsByCryptoCurrencyScreenSelector(internalCurrency),
  );

  const filteredAccounts = useMemo(
    () => allAccounts.sort((a, b) => b.balance - a.balance).slice(0, 3),
    [allAccounts],
  );

  const toggleStar = useCallback(() => {
    const action = isStarred ? removeStarredMarketCoins : addStarredMarketCoins;
    dispatch(action(currencyId));

    if (!isStarred) triggerMarketPushNotificationModal();
  }, [dispatch, isStarred, currencyId, triggerMarketPushNotificationModal]);

  const { range } = chartRequestParams;

  const dateRangeFormatter = useMemo(
    () => getDateFormatter(locale, range),
    [locale, range],
  );

  const renderAccountItem = useCallback(
    ({ item, index }: { item: Account; index: number }) => (
      // @ts-expect-error import js issue
      <AccountRow
        navigation={navigation}
        navigationParams={[
          ScreenName.Account,
          {
            parentId: item?.parentId,
            accountId: item.id,
          },
        ]}
        account={item}
        accountId={item.id}
        isLast={index === allAccounts.length - 1}
        hideDelta
      />
    ),
    [navigation, allAccounts.length],
  );

  useEffect(() => {
    if (name) {
      track("Page Market Coin", {
        currencyName: name,
        starred: isStarred,
        timeframe: chartRequestParams.range,
      });
    }
  }, [name, isStarred, chartRequestParams.range]);

  const [refreshControlVisible, setRefreshControlVisible] = useState(false);

  const handlePullToRefresh = useCallback(() => {
    refreshChart();
    setRefreshControlVisible(true);
  }, [refreshChart, setRefreshControlVisible]);

  useEffect(() => {
    if (refreshControlVisible && !loading) setRefreshControlVisible(false);
  }, [refreshControlVisible, loading]);

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const previousRoute = usePreviousRouteName();

  useEffect(() => {
    if (readOnlyModeEnabled) {
      screen("ReadOnly", "Market Coin", { source: previousRoute });
    }
  }, [readOnlyModeEnabled, previousRoute]);

  const [hoveredItem, setHoverItem] = useState<any>(null);

  return (
    <TabBarSafeAreaView style={{ backgroundColor: colors.background.main }}>
      <ScrollContainerHeader
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        TopLeftSection={<BackButton navigation={navigation} />}
        MiddleSection={
          <Flex
            height={48}
            flexDirection="row"
            justifyContent="flex-start"
            alignItems="center"
          >
            {internalCurrency ? (
              // @ts-expect-error import js issue
              <CircleCurrencyIcon
                size={32}
                currency={internalCurrency}
                color={undefined}
                sizeRatio={0.9}
              />
            ) : (
              image && (
                <IconContainer>
                  <Image
                    source={{ uri: image }}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                </IconContainer>
              )
            )}
            <Text ml={3} variant="large" fontSize={22}>
              {name}
            </Text>
          </Flex>
        }
        TopRightSection={
          <Button
            size="large"
            onPress={toggleStar}
            iconName={isStarred ? "StarSolid" : "Star"}
          />
        }
        BottomSection={
          <>
            <Flex justifyContent="center" alignItems="flex-start" pb={3}>
              <Text variant="h1" mb={1}>
                {counterValueFormatter({
                  currency: counterCurrency,
                  value:
                    hoveredItem && hoveredItem.value
                      ? hoveredItem.value
                      : price,
                  locale,
                  t,
                })}
              </Text>
              <Flex height={20}>
                {hoveredItem && hoveredItem.date ? (
                  <Text variant="body" color="neutral.c70">
                    {dateRangeFormatter.format(hoveredItem.date)}
                  </Text>
                ) : priceChangePercentage !== null &&
                  !isNaN(priceChangePercentage) ? (
                  <DeltaVariation percent value={priceChangePercentage} />
                ) : (
                  <Text variant="body" color="neutral.c70">
                    {" "}
                    -
                  </Text>
                )}
              </Flex>
            </Flex>
            {internalCurrency ? (
              <Flex mb={6}>
                <FabMarketActions
                  currency={internalCurrency}
                  eventProperties={{ currencyName: name, page: "MarketCoin" }}
                  accounts={filteredAccounts}
                  contentContainerStyle={{}}
                />
              </Flex>
            ) : null}
          </>
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
        <MarketGraph
          setHoverItem={setHoverItem}
          chartRequestParams={chartRequestParams}
          loading={loading}
          loadingChart={loadingChart}
          refreshChart={refreshChart}
          chartData={chartData}
        />

        {filteredAccounts && filteredAccounts.length > 0 ? (
          <Flex mx={6} mt={8}>
            <Text variant="h3">{t("distribution.title")}</Text>
            <FlatList
              data={filteredAccounts}
              renderItem={renderAccountItem}
              keyExtractor={(item, index) => item.id + index}
            />
          </Flex>
        ) : null}
        <MarketStats currency={currency} counterCurrency={counterCurrency} />
      </ScrollContainerHeader>
    </TabBarSafeAreaView>
  );
}

export default memo(withDiscreetMode(MarketDetail));
