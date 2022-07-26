// @flow
import React, { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, FlatList } from "react-native";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import {
  isCurrencySupported,
  listTokens,
  useCurrenciesByMarketcap,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/lib/currencies";

import {Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { Account, TokenAccount } from "@ledgerhq/live-common/src/types";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/src/account";
import { useRoute } from "@react-navigation/native";
import { ScreenName } from "../../const";
import { track, TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";
import { flattenAccountsSelector } from "../../reducers/accounts";
import { usePreviousRouteName } from "../../helpers/routeHooks";

const SEARCH_KEYS = ["name", "ticker"];

type Props = {
  devMode: boolean,
  navigation: any,
  route: { params: { filterCurrencyIds?: string[] } },
};

const keyExtractor = (currency: CryptoCurrency | TokenCurrency) => currency.id;

const renderEmptyList = () => (
  <Flex px={6}>
    <LText textAlign="center">
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </Flex>
);

const listSupportedTokens = () =>
  listTokens().filter(t => isCurrencySupported(t.parentCurrency));

const findAccountByCurrency = (accounts: (TokenAccount | Account)[], currency: CryptoCurrency | TokenCurrency) => accounts.filter((acc: TokenAccount | Account) =>
    (acc.type === "Account" ? acc.currency?.id : acc.token.id) === currency.id
  )

export default function AddAccountsSelectCrypto({ navigation, route }: Props) {
  const {t } = useTranslation();
  const routerRoute = useRoute()
  const { filterCurrencyIds = [] } = route.params || {};
  const lastRoute = usePreviousRouteName()
  const cryptoCurrencies = useMemo(
    () =>
      listSupportedCurrencies()
        .concat(listSupportedTokens())
        .filter(
          ({ id }) =>
            filterCurrencyIds.length <= 0 || filterCurrencyIds.includes(id),
        ),
    [filterCurrencyIds],
  );

  const accounts = useSelector(flattenAccountsSelector);

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  const onPressItem = useCallback((currency: CryptoCurrency | TokenCurrency) => {
    track('currency_clicked', {screen: routerRoute.name, currency: currency.name})

    const accs = findAccountByCurrency(accounts, currency);
    if(accs.length > 1) {
      navigation.navigate(ScreenName.ReceiveSelectAccount, {
        currency
      });
    } else if(accs.length === 1) {
      navigation.navigate(ScreenName.ReceiveConfirmation, {
        accountId: accs[0].id,
        parentId: accs[0]?.parentId,
      });
    } else if (currency.type === "TokenCurrency") {
        const parentAccounts = findAccountByCurrency(accounts, currency.parentCurrency);

        if (parentAccounts.length > 1) {
          
          navigation.navigate(ScreenName.ReceiveSelectAccount, {
            currency,
            createTokenAccount: true
          });
        } else if (parentAccounts.length === 1) {
          navigation.navigate(ScreenName.ReceiveConfirmation, {
            accountId: parentAccounts[0].id,
            currency,
            createTokenAccount: true
          });
        } else {
          navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
            currency,
            createTokenAccount: true
          });
        }
      } else {
        navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
          currency,
        });
      }

  }, [accounts, navigation, routerRoute.name]);

  const renderList = useCallback((items: any) => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={({ item }) => (
        <CurrencyRow iconSize={32} currency={item} onPress={onPressItem} />
      )}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
  ), [onPressItem]);

  return (
    <>
      <TrackScreen category="Receive" name="Select Crypto" source={lastRoute} />
      <LText fontSize={32} fontFamily="InterMedium" semiBold px={6} my={3}>{t("transfer.receive.selectCrypto.title")}</LText>
        <FilteredSearchBar
          keys={SEARCH_KEYS}
          inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
          list={sortedCryptoCurrencies}
          renderList={renderList}
          renderEmptySearch={renderEmptyList}
        />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 32,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
    marginBottom: 16
  },
});
