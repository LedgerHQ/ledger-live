import React, { useMemo, useCallback } from "react";
import styled from "styled-components/native";
import { Flex, Button, Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useMarketData } from "@ledgerhq/live-common/lib/market/MarketDataProvider";
import { rangeDataTable } from "@ledgerhq/live-common/lib/market/utils/rangeDataTable";
import { FlatList } from "react-native";
import { starredMarketCoinsSelector } from "../../reducers/settings";
import AnimatedHeaderView from "../../components/AnimatedHeader";
import MarketRowItem from "./MarketRowItem";
import { useLocale } from "../../context/Locale";

export const Main = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${p => p.theme.colors.background.main};
  overflow: hidden;
  width: 100%;
  padding-top: 50px;
`;

export default function Market() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const {
    requestParams,
    refresh,
    counterCurrency,
    setCounterCurrency,
    supportedCounterCurrencies,
    marketData,
  } = useMarketData();

  const { search = "", range, starred = [], liveCompatible } = requestParams;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const starFilterOn = starred.length > 0;

  const updateSearch = useCallback(
    (value: string) => {
      refresh({ search: value, starred: [], liveCompatible: false });
    },
    [refresh],
  );

  const updateTimeRange = useCallback(
    ({ value }) => {
      refresh({ range: value });
    },
    [refresh],
  );

  const toggleFilterByStarredAccounts = useCallback(() => {
    if (starredMarketCoins.length > 0) {
      const starred = starFilterOn ? [] : starredMarketCoins;
      refresh({ starred });
    }
  }, [refresh, starFilterOn, starredMarketCoins]);

  const toggleLiveCompatible = useCallback(() => {
    refresh({ liveCompatible: !liveCompatible });
  }, [liveCompatible, refresh]);

  const timeRanges = useMemo(
    () =>
      Object.keys(rangeDataTable).map(value => ({
        value,
        label: t(`market.range.${value}`),
      })),
    [],
  );

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  const renderItems = useCallback(
    (props: any) => (
      <MarketRowItem
        {...props}
        counterCurrency={counterCurrency}
        locale={locale}
        t={t}
      />
    ),
    [counterCurrency, locale, t],
  );

  return (
    <AnimatedHeaderView hasBackButton title={"Market"}>
      <FlatList data={marketData} renderItem={renderItems} />
    </AnimatedHeaderView>
  );
}
