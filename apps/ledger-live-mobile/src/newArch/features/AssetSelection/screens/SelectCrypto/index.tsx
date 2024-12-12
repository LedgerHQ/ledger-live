import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { FlatList } from "react-native";

import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";

import SafeAreaView from "~/components/SafeAreaView";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { AssetSelectionNavigatorParamsList } from "../../types";
import useSelectCryptoViewModel from "./useSelectCryptoViewModel";

const SEARCH_KEYS = getEnv("CRYPTO_ASSET_SEARCH_KEYS");

const keyExtractor = (currency: CryptoCurrency | TokenCurrency) => currency.id;

const renderEmptyList = () => (
  <Flex px={6}>
    <Text textAlign="center">
      <Trans i18nKey="common.noCryptoFound" />
    </Text>
  </Flex>
);

export default function SelectCrypto({
  route,
}: StackNavigatorProps<AssetSelectionNavigatorParamsList, ScreenName.AddAccountsSelectCrypto>) {
  const { filterCurrencyIds, currency: paramsCurrency, context } = route?.params || {};
  const { titleText, list, onPressItem, debounceTrackOnSearchChange, providersLoadingStatus } =
    useSelectCryptoViewModel({ context, filterCurrencyIds, paramsCurrency });

  const renderList = useCallback(
    (items: CryptoOrTokenCurrency[]) => (
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <BigCurrencyRow currency={item} onPress={onPressItem} subTitle={item.ticker} />
        )}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />
    ),
    [onPressItem],
  );

  const renderListView = useCallback(() => {
    switch (providersLoadingStatus) {
      case "success":
        return list.length > 0 ? (
          <Flex flex={1} ml={6} mr={6} mt={3}>
            <FilteredSearchBar
              keys={SEARCH_KEYS}
              list={list}
              renderList={renderList}
              renderEmptySearch={renderEmptyList}
              onSearchChange={debounceTrackOnSearchChange}
            />
          </Flex>
        ) : (
          renderEmptyList()
        );
      case "error":
        // TODO: in an improvement feature, when the network fetch status is on error, implement a clean error message with a retry CTA
        return renderEmptyList();
      default:
        return (
          <Flex flex={1} mt={6}>
            <InfiniteLoader />
          </Flex>
        );
    }
  }, [providersLoadingStatus, list, renderList, debounceTrackOnSearchChange]);

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <TrackScreen category="Deposit" name="Choose a crypto to secure" />
      <Text variant="h4" fontWeight="semiBold" mx={6} testID="receive-header-step1-title">
        {titleText}
      </Text>
      {renderListView()}
    </SafeAreaView>
  );
}
