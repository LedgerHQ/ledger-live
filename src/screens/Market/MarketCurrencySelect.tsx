import { useMarketData } from "@ledgerhq/live-common/lib/market/MarketDataProvider";
import { Flex, Icon, SearchInput, Text } from "@ledgerhq/native-ui";
import React, { useCallback, memo, useState, useRef, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Search from "../../components/Search";
import { supportedCountervalues } from "../../reducers/settings";

const renderEmptyList = () => (
  <Flex>
    <Text>
      <Trans i18nKey="common.noCryptoFound" />
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

function MarketCurrencySelect({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const {
    counterCurrency,
    supportedCounterCurrencies,
    setCounterCurrency,
  } = useMarketData();
  const [search, setSearch] = useState("");
  const ref = useRef();

  useEffect(() => {
    if (ref && ref?.current?.focus) ref.current.focus();
  }, [ref]);

  const items = supportedCountervalues
    .filter(({ ticker }) =>
      supportedCounterCurrencies.includes(ticker.toLowerCase()),
    )
    .map(cur => ({
      value: cur.ticker.toLowerCase(),
      label: `${cur.name} (${cur.ticker})`,
    }))
    .sort(a => (a.value === counterCurrency ? -1 : 0));

  const onSelectCurrency = useCallback(
    (value: string) => {
      setCounterCurrency(value);
      navigation.goBack();
    },
    [navigation, setCounterCurrency],
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const isChecked = counterCurrency === item.value;
      const color = isChecked ? "primary.c80" : "neutral.c100";
      return (
        <TouchableOpacity
          key={index}
          onPress={() => onSelectCurrency(item.value)}
        >
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            height="48px"
            my={2}
            px={4}
          >
            <Flex flexDirection="row" alignItems="center">
              <Text variant="body" fontWeight="bold" mr={2} color={color}>
                {item.value.toUpperCase()}
              </Text>
              <Text variant="small" fontWeight="semiBold" color={color}>
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
    list => (
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
      <SearchInput
        placeholder={t("common.search")}
        value={search}
        onChange={setSearch}
        ref={ref}
        bg="background.main"
      />

      <Search
        fuseOptions={{
          threshold: 0.1,
          keys: ["value", "label"],
          shouldSort: false,
        }}
        value={search}
        items={items}
        render={renderList}
        renderEmptySearch={renderEmptyList}
      />
    </Flex>
  );
}

export default memo(MarketCurrencySelect);
