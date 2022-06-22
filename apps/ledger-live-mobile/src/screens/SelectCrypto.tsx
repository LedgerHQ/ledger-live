import React, { useCallback, useMemo } from "react";
import { Text } from "@ledgerhq/native-ui";
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native";

import { Trans } from "react-i18next";
import { CryptoCurrency, AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  useCurrenciesByMarketcap,
  listCryptoCurrencies,
} from "@ledgerhq/live-common/lib/currencies";

import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../const";
import LText from "../components/LText";
import CurrencyRow from "../components/CurrencyRow";
import { TrackScreen } from "../analytics";
import KeyboardView from "../components/KeyboardView";
import FilteredSearchBar from "../components/FilteredSearchBar";

type Props = {
  navigation: any;
  route: {
    params?: {};
  };
};

const SEARCH_KEYS = ["name", "ticker"];

type RouteParams = {
  currencies: string[];
  allowAddAccount?: boolean;
  accounts: AccountLike[];
};

const keyExtractor = (currency: CryptoCurrency) => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

export default function SelectCrypto({ navigation, route }: Props) {
  const { colors } = useTheme();
  const cryptoCurrencies = useMemo(() => listCryptoCurrencies(), []);
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressCurrency = useCallback(
    (selectedCurrency: CryptoCurrency) => {
      navigation.navigate(ScreenName.ReceiveSelectAccount, {
        ...route.params,
        selectedCurrency,
      });
    },
    [navigation, route.params],
  );

  const renderList = (items: CryptoCurrency[]) => (
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
      <TrackScreen category="ReceiveFlow" name="SelectCrypto" />
      <Text>Select Crypto</Text>
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
