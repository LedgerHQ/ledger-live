import React, { useCallback, useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import debounce from "lodash/debounce";
import SafeAreaView from "~/components/SafeAreaView";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { NavigatorName, ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { getEnv } from "@ledgerhq/live-env";
import { findAccountByCurrency } from "~/logic/deposit";

import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";

const SEARCH_KEYS = getEnv("CRYPTO_ASSET_SEARCH_KEYS");

type Props = {
  devMode?: boolean;
} & StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveSelectCrypto>;

const keyExtractor = (currency: CryptoCurrency | TokenCurrency) => currency.id;

const renderEmptyList = () => (
  <Flex px={6}>
    <Text textAlign="center">
      <Trans i18nKey="common.noCryptoFound" />
    </Text>
  </Flex>
);

export default function AddAccountsSelectCrypto({ navigation, route }: Props) {
  const paramsCurrency = route?.params?.currency;
  const filterCurrencyIds = route?.params?.filterCurrencyIds;
  const filterCurrencyIdsSet = useMemo(
    () => (filterCurrencyIds ? new Set(filterCurrencyIds) : null),
    [filterCurrencyIds],
  );

  const { t } = useTranslation();
  const accounts = useSelector(flattenAccountsSelector);

  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;
  const { currenciesByProvider, sortedCryptoCurrencies } = result;

  const goToDeviceSelection = useCallback(
    (currency: CryptoCurrency, createTokenAccount?: boolean) => {
      if (llmNetworkBasedAddAccountFlow?.enabled) {
        navigation.replace(NavigatorName.DeviceSelection, {
          screen: ScreenName.SelectDevice,
          params: {
            currency,
            context: AddAccountContexts.ReceiveFunds,
          },
        });
      } else {
        navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
          currency,
          ...(createTokenAccount && { createTokenAccount }),
        });
      }
    },
    [llmNetworkBasedAddAccountFlow?.enabled, navigation],
  );

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
        navigation.navigate(ScreenName.DepositSelectNetwork, {
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
        navigation.navigate(ScreenName.ReceiveSelectAccount, {
          currency,
        });
      } else {
        goToDeviceSelection(currency, isToken);
      }
    },
    [currenciesByProvider, accounts, navigation, filterCurrencyIds, goToDeviceSelection],
  );

  useEffect(() => {
    if (paramsCurrency) {
      const selectedCurrency = findCryptoCurrencyByKeyword(paramsCurrency.toUpperCase());

      if (selectedCurrency && providersLoadingStatus === LoadingStatus.Success) {
        onPressItem(selectedCurrency);
      }
    }
  }, [onPressItem, paramsCurrency, providersLoadingStatus]);

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

  const renderListView = useCallback(() => {
    switch (providersLoadingStatus) {
      case LoadingStatus.Success:
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
      case LoadingStatus.Error:
        // TODO: in an improvement feature, when the network fetch status is on error, implement a clean error message with a retry CTA
        return renderEmptyList();
      default:
        return (
          <Flex flex={1} mt={6}>
            <InfiniteLoader testID="loader" />
          </Flex>
        );
    }
  }, [providersLoadingStatus, list, renderList, debounceTrackOnSearchChange]);

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <TrackScreen category="Deposit" name="Choose a crypto to secure" />
      <Text variant="h4" fontWeight="semiBold" mx={6} testID="receive-header-step1-title">
        {t("transfer.receive.selectCrypto.title")}
      </Text>
      {renderListView()}
    </SafeAreaView>
  );
}
