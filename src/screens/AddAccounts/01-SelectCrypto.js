// @flow
import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import {
  listTokens,
  useCurrenciesByMarketcap,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/lib/currencies";

import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";

const SEARCH_KEYS = ["name", "ticker"];
const forceInset = { bottom: "always" };

type Props = {
  devMode: boolean,
  navigation: any,
};

const keyExtractor = currency => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

export default function AddAccountsSelectCrypto({ navigation }: Props) {
  const { colors } = useTheme();
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies().concat(listTokens()),
    [],
  );

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressCurrency = (currency: CryptoCurrency) => {
    navigation.navigate(ScreenName.AddAccountsSelectDevice, { currency });
  };

  const onPressToken = (token: TokenCurrency) => {
    navigation.navigate(ScreenName.AddAccountsTokenCurrencyDisclaimer, {
      token,
    });
  };

  const onPressItem = (currencyOrToken: CryptoCurrency | TokenCurrency) => {
    if (currencyOrToken.type === "TokenCurrency") {
      onPressToken(currencyOrToken);
    } else {
      onPressCurrency(currencyOrToken);
    }
  };

  const renderList = items => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={({ item }) => (
        <CurrencyRow currency={item} onPress={onPressItem} />
      )}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="AddAccounts" name="SelectCrypto" />
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
