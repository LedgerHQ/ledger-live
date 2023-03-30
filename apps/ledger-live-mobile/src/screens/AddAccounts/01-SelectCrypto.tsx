import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native";
import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  isCurrencySupported,
  listTokens,
  useCurrenciesByMarketcap,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";
import { AddAccountsNavigatorParamList } from "../../components/RootNavigator/types/AddAccountsNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

const SEARCH_KEYS = ["name", "ticker"];

type NavigationProps = StackNavigatorProps<
  AddAccountsNavigatorParamList,
  ScreenName.AddAccountsSelectCrypto
>;

type Props = {
  devMode?: boolean;
} & NavigationProps;

const keyExtractor = (currency: CryptoOrTokenCurrency) => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

const listSupportedTokens = () =>
  listTokens().filter(t => isCurrencySupported(t.parentCurrency));

export default function AddAccountsSelectCrypto({ navigation, route }: Props) {
  const { colors } = useTheme();
  const devMode = useEnv("MANAGER_DEV_MODE");
  const { filterCurrencyIds = [], currency } = route.params || {};

  const avaxCChain = useFeature("currencyAvalancheCChain");

  const featureFlaggedCurrencies = useMemo(
    () => ({
      avalanche_c_chain: avaxCChain,
    }),
    [avaxCChain],
  );

  const cryptoCurrencies = useMemo(() => {
    const currencies = [
      ...listSupportedCurrencies(),
      ...listSupportedTokens(),
    ].filter(
      ({ id }) =>
        filterCurrencyIds.length <= 0 || filterCurrencyIds.includes(id),
    );
    const deactivatedCurrencies = Object.entries(featureFlaggedCurrencies)
      .filter(([, feature]) => !feature?.enabled)
      .map(([name]) => name);

    const currenciesFiltered = currencies.filter(
      c => !deactivatedCurrencies.includes(c.id),
    );

    if (!devMode) {
      return currenciesFiltered.filter(
        c => c.type !== "CryptoCurrency" || !c.isTestnetFor,
      );
    }
    return currenciesFiltered;
  }, [devMode, featureFlaggedCurrencies, filterCurrencyIds]);

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressCurrency = (currency: CryptoCurrency) => {
    navigation.navigate(ScreenName.AddAccountsSelectDevice, {
      ...(route?.params ?? {}),
      currency,
    });
  };

  const onPressToken = (token: TokenCurrency) => {
    navigation.navigate(ScreenName.AddAccountsTokenCurrencyDisclaimer, {
      token,
    });
  };

  const onPressItem = (currencyOrToken: CryptoOrTokenCurrency) => {
    if (currencyOrToken.type === "TokenCurrency") {
      onPressToken(currencyOrToken);
    } else {
      onPressCurrency(currencyOrToken);
    }
  };

  const renderList = (items: CryptoOrTokenCurrency[]) => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={({ item }: { item: CryptoOrTokenCurrency }) => (
        <CurrencyRow currency={item} onPress={onPressItem} />
      )}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
  );

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="AddAccounts" name="SelectCrypto" />
      <View style={styles.searchContainer}>
        <FilteredSearchBar
          keys={SEARCH_KEYS}
          inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
          list={sortedCryptoCurrencies}
          renderList={renderList}
          renderEmptySearch={renderEmptyList}
          initialQuery={currency}
        />
      </View>
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
