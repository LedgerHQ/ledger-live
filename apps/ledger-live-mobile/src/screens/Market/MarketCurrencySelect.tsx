import { useMarketData } from "@ledgerhq/live-common/market/MarketDataProvider";
import { Flex, Icon, SearchInput, Text } from "@ledgerhq/native-ui";
import React, { useCallback, memo, useState, useRef, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList, TouchableOpacity, Image, TextInput } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { useDispatch, useSelector } from "react-redux";
import Search from "~/components/Search";
import { getSupportedCounterValues } from "~/reducers/settings";
import { setMarketCounterCurrency } from "~/actions/settings";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";

const RenderEmptyList = ({ theme, search }: { theme: string; search: string }) => (
  // FIXME: NO textAlign ON VIEW COMPONENTS
  <Flex alignItems="center">
    <Image
      style={{ width: 164, height: 164 }}
      source={
        theme === "light"
          ? require("~/images/marketNoResultslight.png")
          : require("~/images/marketNoResultsdark.png")
      }
    />
    <Text textAlign="center" variant="h4" my={3}>
      <Trans i18nKey="market.warnings.noCurrencyFound" />
    </Text>
    <Text textAlign="center" variant="body" color="neutral.c70">
      <Trans i18nKey="market.warnings.noCurrencySearchResultsFor" values={{ search }}>
        <Text fontWeight="bold" variant="body" color="neutral.c70">
          {""}
        </Text>
      </Trans>
    </Text>
  </Flex>
);

const CheckIconContainer = styled(Flex).attrs({
  bg: "primary.c80",
  flexDirection: "row",
  justifyContent: " center",
  alignItems: "center",
  height: 24,
  width: 24,
})`
  border-radius: 24px;
`;

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.MarketCurrencySelect>;

function MarketCurrencySelect({ navigation }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const supportedCountervalues = useSelector(getSupportedCounterValues);
  const { colors } = useTheme();
  const { counterCurrency, supportedCounterCurrencies, setCounterCurrency } = useMarketData();
  const [search, setSearch] = useState("");
  const ref = useRef<TextInput | null>(null);

  useEffect(() => {
    if (ref && ref?.current?.focus) ref.current.focus();
  }, [ref]);

  const items = supportedCountervalues
    .filter(({ ticker }) => supportedCounterCurrencies.includes(ticker.toLowerCase()))
    .map(cur => ({
      value: cur.ticker.toLowerCase(),
      label: cur.label,
    }))
    .sort(a => (a.value === counterCurrency ? -1 : 0));

  const onSelectCurrency = useCallback(
    (value: string) => {
      dispatch(setMarketCounterCurrency(value));
      setCounterCurrency(value);
      navigation.goBack();
    },
    [dispatch, navigation, setCounterCurrency],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof items)[number]; index: number }) => {
      const isChecked = counterCurrency === item.value;
      const color = isChecked ? "primary.c80" : "neutral.c100";
      const labelColor = isChecked ? "primary.c80" : "neutral.c80";
      return (
        <TouchableOpacity key={index} onPress={() => onSelectCurrency(item.value)}>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            height="48px"
            my={2}
            px={4}
          >
            <Flex flexDirection="row" alignItems="center">
              <Text variant="body" fontWeight="bold" mr={3} color={color}>
                {item.value.toUpperCase()}
              </Text>
              <Text variant="small" fontWeight="semiBold" color={labelColor}>
                {item.label}
              </Text>
            </Flex>
            {counterCurrency === item.value ? (
              <CheckIconContainer>
                <Icon name="CheckAlone" size={12} color="background.main" />
              </CheckIconContainer>
            ) : null}
          </Flex>
        </TouchableOpacity>
      );
    },
    [counterCurrency, onSelectCurrency],
  );

  const renderList = useCallback(
    (list: typeof items) => (
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.value + index}
      />
    ),
    [renderItem],
  );

  return (
    <Flex bg="background.main" px={3} py={2}>
      <SearchInput placeholder={t("common.search")} value={search} onChange={setSearch} ref={ref} />

      <Search
        fuseOptions={{
          threshold: 0.1,
          keys: ["value", "label"],
          shouldSort: false,
        }}
        value={search}
        items={items}
        render={renderList}
        // This props is badly type
        renderEmptySearch={(() => () => (
          <RenderEmptyList theme={colors.palette.type} search={search} />
        ))()}
      />
    </Flex>
  );
}

export default memo(MarketCurrencySelect);
