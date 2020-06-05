// @flow

import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList } from "react-native";
// $FlowFixMe
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import {
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/lib/currencies";

import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { track } from "../../analytics/segment";
import { listCryptoCurrencies } from "../../cryptocurrencies";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";
import { supportedCurrenciesIds } from "./coinifyConfig";

import colors from "../../colors";

const SEARCH_KEYS = ["name", "ticker"];
const forceInset = { bottom: "always" };

type Props = {
  devMode: boolean,
  navigation: NavigationScreenProp<{
    params: {},
  }>,
};

const keyExtractor = currency => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

export default function ExchangeSelectCrypto({ navigation }: Props) {
  const devMode = useEnv("MANAGER_DEV_MODE");

  const cryptoCurrencies = useMemo(
    () => listCryptoCurrencies(devMode).concat(listTokens()),
    [devMode],
  );

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const supportedCryptoCurrencies = sortedCryptoCurrencies.filter(currency =>
    supportedCurrenciesIds.includes(currency.id),
  );

  const onPressCurrency = (currency: CryptoCurrency) => {
    track("Buy Crypto Continue Button", { currencyName: currency.name });
    navigation.navigate("ExchangeSelectAccount", { currency });
  };

  const onPressToken = (token: TokenCurrency) => {
    navigation.navigate("ExchangeSelectAccount", {
      currency: token,
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
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="Exchange" name="SelectCrypto" />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
            list={supportedCryptoCurrencies}
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
    backgroundColor: colors.white,
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
