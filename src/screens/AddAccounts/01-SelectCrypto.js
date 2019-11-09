// @flow

import React, { useMemo } from "react";
import { translate, Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
// $FlowFixMe
import { SafeAreaView, FlatList } from "react-navigation";
import i18next from "i18next";
import { compose } from "redux";
import type { NavigationScreenProp } from "react-navigation";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import {
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/lib/currencies";

import { listCryptoCurrencies } from "../../cryptocurrencies";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";

import colors from "../../colors";
import withEnv from "../../logic/withEnv";

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

const AddAccountsSelectCrypto = ({ devMode, navigation }: Props) => {
  const cryptoCurrencies = useMemo(
    () => listCryptoCurrencies(devMode).concat(listTokens()),
    [devMode],
  );

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressCurrency = (currency: CryptoCurrency) => {
    navigation.navigate("AddAccountsSelectDevice", { currency });
  };

  const onPressToken = (token: TokenCurrency) => {
    navigation.navigate("AddAccountsTokenCurrencyDisclaimer", {
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
    <SafeAreaView style={styles.root} forceInset={forceInset}>
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
};

AddAccountsSelectCrypto.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("common.cryptoAsset")}
      subtitle={i18next.t("send.stepperHeader.stepRange", {
        currentStep: "1",
        totalSteps: "3",
      })}
    />
  ),
};

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

const enhancer = compose(
  translate(),
  withEnv("MANAGER_DEV_MODE", "devMode"),
);

export default enhancer(AddAccountsSelectCrypto);
