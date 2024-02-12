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

import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { getEnv } from "@ledgerhq/live-env";
import { findAccountByCurrency } from "~/logic/deposit";

import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import DepositFromCoinbaseButton from "./DepositFromCoinbaseButton";
import { CexDepositEntryPointsLocationsMobile } from "@ledgerhq/types-live/lib/cexDeposit";

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
        // If we didn't find any account of the parent currency then we add one
        navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
          currency,
          createTokenAccount: isToken || undefined,
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
        ListHeaderComponent={
          <DepositFromCoinbaseButton
            location={CexDepositEntryPointsLocationsMobile.selectCrypto}
            source="Choose a crypto to secure"
          />
        }
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
    <>
      <TrackScreen category="Deposit" name="Choose a crypto to secure" />
      <Text variant="h4" fontWeight="semiBold" mx={6} mb={3} testID="receive-header-step1-title">
        {t("transfer.receive.selectCrypto.title")}
      </Text>
      {list.length > 0 ? (
        <FilteredSearchBar
          keys={SEARCH_KEYS}
          inputWrapperStyle={{ marginHorizontal: 16, marginBottom: 8 }}
          list={list}
          renderList={renderList}
          renderEmptySearch={renderEmptyList}
          newSearchBar
          onSearchChange={debounceTrackOnSearchChange}
        />
      ) : (
        <Flex flex={1} mt={6}>
          <InfiniteLoader />
        </Flex>
      )}
    </>
  );
}
