import React, { useCallback, useMemo, memo } from "react";
import { FlatList, TouchableOpacity } from "react-native";
import { Box, Flex, Icons, Text } from "@ledgerhq/native-ui";

import { Trans, useTranslation } from "react-i18next";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/lib/currencies";
import TrackScreen from "../../../analytics/TrackScreen";
import NoResultsFound from "../../../icons/NoResultsFound";

import NoAccounts from "../NoAccounts";
import ReadOnlyAccountRow from "./ReadOnlyAccountRow";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";

import FilteredSearchBar from "../../../components/FilteredSearchBar";
import GradientContainer from "../../../components/GradientContainer";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];

type Props = {
  navigation: any;
  route: { params?: { currency?: string; search?: string } };
};

const maxReadOnlyCryptoCurrencies = 10;

function ReadOnlyAccounts({ navigation, route }: Props) {
  const listSupportedTokens = useCallback(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies().concat(listSupportedTokens()),
    [listSupportedTokens],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const accounts = useMemo(
    () => sortedCryptoCurrencies.slice(0, maxReadOnlyCryptoCurrencies),
    [sortedCryptoCurrencies],
  );

  const { t } = useTranslation();

  const { params } = route;

  const search = params?.search;

  const renderItem = useCallback(
    ({ item }: { item: Account | TokenAccount }) => (
      <ReadOnlyAccountRow navigation={navigation} currency={item} />
    ),
    [navigation],
  );

  const renderList = useCallback(
    items => (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(i: any) => i.id}
        ListEmptyComponent={<NoAccounts />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: TAB_BAR_SAFE_HEIGHT,
        }}
        ListFooterComponent={
          <GradientContainer containerStyle={{ marginHorizontal: 16 }}>
            <Flex p={6} alignItems="center" justifyContent="center">
              <Text
                variant="large"
                fontWeight="semiBold"
                color="neutral.c100"
                textAlign="center"
              >
                + more than 6000 others
              </Text>
              <Text
                variant="small"
                fontWeight="medium"
                color="neutral.c70"
                textAlign="center"
                mt={3}
              >
                Ledger supports more than 6000 coins and tokens
              </Text>
            </Flex>
          </GradientContainer>
        }
      />
    ),
    [renderItem],
  );

  const renderEmptySearch = useCallback(
    () => (
      <Flex alignItems="center" justifyContent="center" pb="50px" pt="30px">
        <NoResultsFound />
        <Text
          color="neutral.c100"
          fontWeight="medium"
          variant="h2"
          mt={6}
          textAlign="center"
        >
          <Trans i18nKey="accounts.noResultsFound" />
        </Text>
        <Flex>
          <Text
            color="neutral.c80"
            fontWeight="medium"
            variant="body"
            pt={6}
            textAlign="center"
          >
            <Trans i18nKey="accounts.noResultsDesc" />
          </Text>
        </Flex>
      </Flex>
    ),
    [t],
  );

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="Accounts" accountsLength={accounts.length} />
      <Flex flex={1} bg={"background.main"}>
        <Flex p={6} flexDirection="row" alignItems="center">
          <Box mr={3}>
            <TouchableOpacity onPress={navigation.goBack}>
              <Icons.ArrowLeftMedium size={24} />
            </TouchableOpacity>
          </Box>
          <Flex
            height={30}
            flexDirection="column"
            justifyContent="center"
            mt={4}
            mb={3}
            flex={1}
          >
            <Text variant="h1">{t("distribution.title")}</Text>
          </Flex>
        </Flex>

        <FilteredSearchBar
          list={accounts}
          inputWrapperStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
          renderList={renderList}
          renderEmptySearch={renderEmptySearch}
          keys={SEARCH_KEYS}
          initialQuery={search}
        />
      </Flex>
    </TabBarSafeAreaView>
  );
}

export default memo(withDiscreetMode(ReadOnlyAccounts));
