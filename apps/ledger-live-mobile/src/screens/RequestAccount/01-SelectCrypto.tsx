import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList, SafeAreaView, ListRenderItem } from "react-native";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import KeyboardView from "~/components/KeyboardView";
import CurrencyRow from "~/components/CurrencyRow";
import LText from "~/components/LText";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { RequestAccountNavigatorParamList } from "~/components/RootNavigator/types/RequestAccountNavigator";
import { getEnv } from "@ledgerhq/live-env";

const SEARCH_KEYS = getEnv("CRYPTO_ASSET_SEARCH_KEYS");

type Navigation = StackNavigatorProps<
  RequestAccountNavigatorParamList,
  ScreenName.RequestAccountsSelectCrypto
>;

type Props = Navigation;

const keyExtractor = (currency: CryptoOrTokenCurrency) => currency.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

export default function RequestAccountsSelectCrypto({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { currencies } = route.params;
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(currencies);
  const onPressCurrency = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      navigation.navigate(ScreenName.RequestAccountsSelectAccount, {
        ...route.params,
        currency,
      });
    },
    [navigation, route.params],
  );
  const renderItem: ListRenderItem<CryptoOrTokenCurrency> = useCallback(
    ({ item }) => <CurrencyRow currency={item} onPress={onPressCurrency} />,
    [onPressCurrency],
  );
  const renderList = useCallback(
    (items: CryptoOrTokenCurrency[]) => (
      <FlatList
        initialNumToRender={20}
        contentContainerStyle={styles.list}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />
    ),
    [renderItem],
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
      <TrackScreen category="RequestAccounts" name="SelectCrypto" />
      <KeyboardView>
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
