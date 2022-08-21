import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, FlatList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { useTheme } from "@react-navigation/native";
import { track } from "../../analytics/segment";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";
import { NavigatorName, ScreenName } from "../../const";
import { useRampCatalogCurrencies } from "./hooks";

const SEARCH_KEYS = ["name", "ticker"];
const forceInset = {
  bottom: "always",
};
type Props = {
  devMode: boolean;
  navigation: any;
  route: {
    params?: {
      currency?: string;
      mode: "buy" | "sell";
      onCurrencyChange: (_: CryptoCurrency | TokenCurrency) => void;
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

export default function ExchangeSelectCrypto({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { params = {} } = route;
  const {
    currency: initialCurrencySelected,
    mode = "buy",
    onCurrencyChange,
  } = params;
  const rampCatalog = useRampCatalog();
  const cryptoCurrencies = useRampCatalogCurrencies(
    mode === "buy" ? rampCatalog.value.onRamp : rampCatalog.value.offRamp,
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const onPressCurrency = useCallback(
    (currency: CryptoCurrency) => {
      if (onCurrencyChange) {
        onCurrencyChange(currency);
      }

      const destinationScreen =
        mode === "buy" ? ScreenName.ExchangeBuy : ScreenName.ExchangeSell;
      navigation.navigate(NavigatorName.Exchange, {
        screen: destinationScreen,
      });
    },
    [mode, navigation, onCurrencyChange],
  );
  const onPressToken = useCallback(
    (token: TokenCurrency) => {
      if (onCurrencyChange) {
        onCurrencyChange(token);
      }

      const destinationScreen =
        mode === "buy" ? ScreenName.ExchangeBuy : ScreenName.ExchangeSell;
      navigation.navigate(NavigatorName.Exchange, {
        screen: destinationScreen,
      });
    },
    [mode, navigation, onCurrencyChange],
  );
  const onPressItem = useCallback(
    (currencyOrToken: CryptoCurrency | TokenCurrency) => {
      track("Buy Crypto Continue Button", {
        currencyName: currencyOrToken.name,
      });

      if (currencyOrToken.type === "TokenCurrency") {
        onPressToken(currencyOrToken);
      } else {
        onPressCurrency(currencyOrToken);
      }
    },
    [onPressCurrency, onPressToken],
  );

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
      forceInset={forceInset}
    >
      <TrackScreen category="Exchange" name="SelectCrypto" />
      <KeyboardView style={styles.keybaordContainer}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
            list={sortedCryptoCurrencies}
            renderList={renderList}
            renderEmptySearch={renderEmptyList}
            initialQuery={initialCurrencySelected}
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
  keybaordContainer: {
    flex: 1,
  },
});
