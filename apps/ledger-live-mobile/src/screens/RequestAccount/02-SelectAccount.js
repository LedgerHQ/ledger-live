/* @flow */

import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import type {
  Account,
  AccountLike,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/types/index";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { accountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import KeyboardView from "../../components/KeyboardView";
import { formatSearchResultsTuples } from "../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";
import { NavigatorName, ScreenName } from "../../const";
import Button from "../../components/Button";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  currencies: string[],
  currency: CryptoCurrency | TokenCurrency,
  allowAddAccount?: boolean,

  onSuccess: (account: Account) => void,
  onError: (error: Error) => void,
};

function SelectAccount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { currency, allowAddAccount, onSuccess, onError } = route.params;

  const accounts: AccountLike[] = useSelector(
    accountsByCryptoCurrencyScreenSelector(currency),
  );

  const keyExtractor = item => item.account.id;

  const onSelect = useCallback(
    (account: AccountLike, parentAccount: Account) => {
      onSuccess(account, parentAccount);
      const n = navigation.getParent() || navigation;
      n.pop();
    },
    [navigation, onSuccess],
  );

  const renderItem = useCallback(
    ({ item: result }: { item: SearchResult }) => {
      const { account, parentAccount, match } = result;

      return (
        <View>
          <AccountCard
            disabled={!match}
            account={account}
            style={styles.card}
            // $FlowFixMe
            onPress={() => onSelect(account, parentAccount)}
          />
        </View>
      );
    },
    [onSelect],
  );

  const onAddAccount = useCallback(() => {
    navigation.navigate(NavigatorName.RequestAccountsAddAccounts, {
      screen: ScreenName.AddAccountsSelectDevice,
      params: {
        currency,
        onSuccess: () =>
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectAccount,
            params: route.params,
          }),
        onError,
      },
    });
  }, [currency, navigation, onError, route.params]);

  const renderFooter = useCallback(
    () =>
      allowAddAccount ? (
        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.button}
            event="ExchangeStartBuyFlow"
            type="primary"
            title={
              <Trans
                i18nKey="requestAccount.selectAccount.addAccount"
                values={{ currency: currency.name }}
              />
            }
            onPress={onAddAccount}
          />
        </View>
      ) : null,
    [allowAddAccount, currency.name, onAddAccount],
  );

  const renderList = useCallback(
    items => {
      // $FlowFixMe
      const formatedList = formatSearchResultsTuples(items);
      return (
        <>
          <FlatList
            data={formatedList}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            ListFooterComponent={renderFooter}
          />
        </>
      );
    },
    [renderFooter, renderItem],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="RequestAccount" name="SelectAccount" />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          {accounts.length > 0 ? (
            <FilteredSearchBar
              keys={SEARCH_KEYS}
              inputWrapperStyle={styles.card}
              list={accounts}
              renderList={renderList}
              renderEmptySearch={() => (
                <View style={styles.emptyResults}>
                  <LText style={styles.emptyText} color="fog">
                    <Trans i18nKey="transfer.receive.noAccount" />
                  </LText>
                </View>
              )}
            />
          ) : (
            renderFooter()
          )}
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addAccountButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
  },
  root: {
    flex: 1,
  },
  tokenCardStyle: {
    marginLeft: 26,
    paddingLeft: 7,
    borderLeftWidth: 1,
  },
  card: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  searchContainer: {
    paddingTop: 18,
    flex: 1,
  },
  list: {
    paddingTop: 8,
  },
  emptyResults: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  button: {
    flex: 1,
  },
  buttonContainer: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
  },
});

export default SelectAccount;
