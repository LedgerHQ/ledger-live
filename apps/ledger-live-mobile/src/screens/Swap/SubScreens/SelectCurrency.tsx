import React, { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TFunction, useTranslation } from "react-i18next";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { TrackScreen, useAnalytics } from "~/analytics";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import KeyboardView from "~/components/KeyboardView";
import CurrencyRow from "~/components/CurrencyRow";
import { SelectCurrencyParamList } from "../types";
import { ScreenName } from "~/const";
import { sharedSwapTracking } from "../utils";
import { getEnv } from "@ledgerhq/live-env";

function keyExtractor({ id }: CryptoCurrency | TokenCurrency) {
  return id;
}

const getItemLayout = (_: unknown, index: number) => ({
  length: 64,
  offset: 64 * index,
  index,
});

export function SelectCurrency({
  navigation,
  route: {
    params: { provider, currencies },
  },
}: SelectCurrencyParamList) {
  const { t } = useTranslation();
  const { track } = useAnalytics();

  const onSelect = useCallback(
    (currency: CryptoCurrency | TokenCurrency) => {
      track("button_clicked", {
        ...sharedSwapTracking,
        button: "new target currency",
        currency: currency.name,
      });
      // @ts-expect-error navigation type is only partially declared
      navigation.navigate(ScreenName.SwapForm, { currency });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const RenderItem = ({ item }: { item: CryptoCurrency | TokenCurrency }) => {
    return <CurrencyRow currency={item} onPress={onSelect} />;
  };

  const sortedCurrencies = useCurrenciesByMarketcap(currencies);

  const renderList = useCallback(
    (items: (TokenCurrency | CryptoCurrency)[]) => (
      <FlatList
        contentContainerStyle={styles.list}
        removeClippedSubviews={true}
        data={items}
        renderItem={RenderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        getItemLayout={getItemLayout}
        maxToRenderPerBatch={13}
        windowSize={7}
        initialNumToRender={13}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <KeyboardView>
      <Flex>
        <TrackScreen category="Swap Form" name="Edit Target Currency" provider={provider} />

        <FilteredSearchBar
          keys={getEnv("CRYPTO_ASSET_SEARCH_KEYS")}
          inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
          // @ts-expect-error dissonance between Currency[] & (TokenCurrency | CryptoCurrency)[]
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
