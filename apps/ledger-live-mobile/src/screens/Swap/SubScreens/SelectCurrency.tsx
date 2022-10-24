import React, { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TFunction, useTranslation } from "react-i18next";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/index";
import { TrackScreen } from "../../../analytics";
import FilteredSearchBar from "../../../components/FilteredSearchBar";
import KeyboardView from "../../../components/KeyboardView";
import CurrencyRow from "../../../components/CurrencyRow";
import { SelectCurrencyParamList } from "../types";
import { ScreenName } from "../../../const";

export function SelectCurrency({
  navigation,
  route: {
    params: { provider, currencies },
  },
}: SelectCurrencyParamList) {
  const { t } = useTranslation();

  const onSelect = useCallback(
    (currency: CryptoCurrency | TokenCurrency) => {
      // @ts-expect-error navigation type is only partially declared
      navigation.navigate(ScreenName.SwapForm, { currency });
    },
    [navigation],
  );
  const sortedCurrencies = useCurrenciesByMarketcap(currencies);

  const renderList = useCallback(
    items => (
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        renderItem={({ item }) => (
          <CurrencyRow currency={item} onPress={onSelect} />
        )}
        keyExtractor={currency => currency.id}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />
    ),
    [onSelect],
  );

  return (
    <KeyboardView>
      <Flex>
        <TrackScreen
          category="Swap Form"
          name="Edit Target Currency"
          provider={provider}
        />

        <FilteredSearchBar
          keys={["name", "ticker"]}
          inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
          list={sortedCurrencies}
          renderList={renderList}
          renderEmptySearch={renderEmptyList(t)}
        />
      </Flex>
    </KeyboardView>
  );
}

function renderEmptyList(t: TFunction) {
  return () => (
    <Flex padding={4} alignItems="center">
      <Text>{t("common.noCryptoFound")}</Text>
    </Flex>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 32,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
