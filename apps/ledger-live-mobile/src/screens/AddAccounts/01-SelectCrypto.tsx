import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList, SafeAreaView } from "react-native";
import type {
  CryptoCurrency,
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
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";

const SEARCH_KEYS = ["name", "ticker"];
type Props = {
  devMode: boolean;
  navigation: any;
  route: {
    params: {
      filterCurrencyIds?: string[];
    };
  };
};

const keyExtractor = currency => currency.id;

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
  const { filterCurrencyIds = [] } = route.params || {};

  const osmo = useFeature("currencyOsmosisMobile");
  const fantom = useFeature("currencyFantomMobile");
  const moonbeam = useFeature("currencyMoonbeamMobile");
  const cronos = useFeature("currencyCronosMobile");
  const songbird = useFeature("currencySongbirdMobile");
  const flare = useFeature("currencyFlareMobile");

  const featureFlaggedCurrencies = useMemo(
    () => ({
      osmo,
      fantom,
      moonbeam,
      cronos,
      songbird,
      flare,
    }),
    [osmo, fantom, moonbeam, cronos, songbird, flare],
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

    return currencies.filter(c => !deactivatedCurrencies.includes(c.id));
  }, [featureFlaggedCurrencies, filterCurrencyIds]);

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
