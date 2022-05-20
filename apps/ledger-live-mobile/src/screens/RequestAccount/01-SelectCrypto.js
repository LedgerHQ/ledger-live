// @flow
import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native";
import type {
  CryptoCurrency,
  AccountLike,
} from "@ledgerhq/live-common/types/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/index";

import { useTheme } from "@react-navigation/native";
import { useCurrencies } from "@ledgerhq/live-common/currencies/react";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";

const SEARCH_KEYS = ["name", "ticker"];

type Props = {
  devMode: boolean,
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  currencies: string[],
  allowAddAccount?: boolean,
  includeTokens?: boolean,
  accounts: AccountLike[],
};

const keyExtractor = currency => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

export default function RequestAccountsSelectCrypto({
  navigation,
  route,
}: Props) {
  const { colors } = useTheme();
  const { currencies, includeTokens } = route.params;
  const allCurrencies = useCurrencies(includeTokens);

  const cryptoCurrencies = useMemo(
    () => allCurrencies.filter(c => currencies.includes(c.id)),
    [currencies, allCurrencies],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressCurrency = (currency: CryptoCurrency) => {
    navigation.navigate(ScreenName.RequestAccountsSelectAccount, {
      ...route.params,
      currency,
    });
  };

  const renderList = items => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={({ item }) => (
        <CurrencyRow currency={item} onPress={onPressCurrency} />
      )}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="RequestAccounts" name="SelectCrypto" />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
            list={sortedCryptoCurrencies}
            renderList={renderList}
            renderEmptySearch={renderEmptyList}
          />
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
  },
  list: {
    paddingBottom: 32,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    textAlign: "center",
  },
});
