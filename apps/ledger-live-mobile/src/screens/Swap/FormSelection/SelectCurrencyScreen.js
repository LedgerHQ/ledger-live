// @flow
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native";
import type { CryptoCurrency } from "@ledgerhq/live-common/types/index";

import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/index";
import { getSupportedCurrencies } from "@ledgerhq/live-common/exchange/swap/logic";

import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { SwapRouteParams } from "..";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import FilteredSearchBar from "../../../components/FilteredSearchBar";
import KeyboardView from "../../../components/KeyboardView";
import CurrencyRow from "../../../components/CurrencyRow";
import LText from "../../../components/LText";

const SEARCH_KEYS = ["name", "ticker"];

type Props = {
  devMode: boolean,
  navigation: any,
  route: { params: SwapRouteParams },
};

const keyExtractor = currency => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

export default function SwapFormSelectCurrencyScreen({
  navigation,
  route,
}: Props) {
  const { colors } = useTheme();
  const { swap, providers, provider, setCurrency } = route.params;

  const selectableCurrencies = getSupportedCurrencies({ providers, provider });

  const maybeFilteredCurrencies = swap.from.account
    ? selectableCurrencies.filter(
        c => c !== getAccountCurrency(swap.from.account),
      )
    : selectableCurrencies;
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(
    maybeFilteredCurrencies,
  );

  const onPressCurrency = useCallback(
    (currency: CryptoCurrency) => {
      setCurrency && setCurrency(currency);
      navigation.navigate(ScreenName.SwapForm, {
        ...route.params,
      });
    },
    [navigation, route.params, setCurrency],
  );

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
      <TrackScreen
        category="Swap Form"
        name="Edit Target Currency"
        provider={provider}
      />
      <KeyboardView style={styles.root}>
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
    marginBottom: 8,
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    textAlign: "center",
  },
});
