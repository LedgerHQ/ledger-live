import React, { useCallback, useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import debounce from "lodash/debounce";
import { useSelector } from "react-redux";

import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { getEnv } from "@ledgerhq/live-env";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";

import SafeAreaView from "~/components/SafeAreaView";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { findAccountByCurrency } from "~/logic/deposit";
import { AssetSelectionNavigatorParamsList } from "../../types";

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
  navigation,
  route,
}: StackNavigatorProps<AssetSelectionNavigatorParamsList, ScreenName.AddAccountsSelectCrypto>) {
  const paramsCurrency = route?.params?.currency;
  const filterCurrencyIds = route?.params?.filterCurrencyIds;
  const filterCurrencyIdsSet = useMemo(
    () => (filterCurrencyIds ? new Set(filterCurrencyIds) : null),
    [filterCurrencyIds],
  );

  const { t } = useTranslation();
  const accounts = useSelector(flattenAccountsSelector);

  const { currenciesByProvider, sortedCryptoCurrencies } = useGroupedCurrenciesByProvider();

  const onPressItem = useCallback(
    (curr: CryptoCurrency | TokenCurrency) => {
      track("asset_clicked", {
        asset: curr.name,
        page: "Choose a crypto to secure",
      });

      const provider = currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork => (currencyByNetwork as CryptoCurrency | TokenCurrency).id === curr.id,
        ),
      );

      // If the selected currency exists on multiple networks we redirect to the SelectNetwork screen
      if (provider && provider?.currenciesByNetwork.length > 1) {
        navigation.navigate(ScreenName.SelectNetwork, {
          provider,
          filterCurrencyIds,
        });
        return;
      }

      const isToken = curr.type === "TokenCurrency";
      const currency = isToken ? curr.parentCurrency : curr;
      const currencyAccounts = findAccountByCurrency(accounts, currency);

      if (currencyAccounts.length > 0) {
        // If we found one or more accounts of the currency then we select account
        navigation.navigate(NavigatorName.AddAccounts, {
          screen: ScreenName.SelectAccounts,
          params: {
            currency,
          },
        });
      } else {
        // If we didn't find any account of the parent currency then we add one
        navigation.navigate(NavigatorName.DeviceSelection, {
          screen: ScreenName.SelectDevice,
          params: {
            currency,
            createTokenAccount: isToken || undefined,
          },
        });
      }
    },
    [currenciesByProvider, accounts, navigation, filterCurrencyIds],
  );

  useEffect(() => {
    if (paramsCurrency) {
      const selectedCurrency = findCryptoCurrencyByKeyword(paramsCurrency.toUpperCase());

      if (selectedCurrency) {
        onPressItem(selectedCurrency);
      }
    }
  }, [onPressItem, paramsCurrency]);

  const debounceTrackOnSearchChange = debounce((newQuery: string) => {
    track("asset_searched", { page: "Choose a crypto to secure", asset: newQuery });
  }, 1500);

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

  const list = useMemo(
    () =>
      filterCurrencyIdsSet
        ? sortedCryptoCurrencies.filter(crypto => filterCurrencyIdsSet.has(crypto.id))
        : sortedCryptoCurrencies,
    [filterCurrencyIdsSet, sortedCryptoCurrencies],
  );

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <TrackScreen category="Deposit" name="Choose a crypto to secure" />
      <Text variant="h4" fontWeight="semiBold" mx={6} testID="receive-header-step1-title">
        {t("transfer.receive.selectCrypto.title")}
      </Text>
      {list.length > 0 ? (
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
        <Flex flex={1} mt={6}>
          <InfiniteLoader />
        </Flex>
      )}
    </SafeAreaView>
  );
}
