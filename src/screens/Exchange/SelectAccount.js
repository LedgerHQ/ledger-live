/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
// $FlowFixMe
import SafeAreaView from "react-native-safe-area-view";
import type { NavigationScreenProp } from "react-navigation";
import { Trans } from "react-i18next";
import type {
  Account,
  AccountLikeArray,
} from "@ledgerhq/live-common/lib/types";
import { useSelector } from "react-redux";
import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import KeyboardView from "../../components/KeyboardView";
import { formatSearchResults } from "../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];
const forceInset = { bottom: "always" };

type Navigation = NavigationScreenProp<{ params: {} }>;

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: Navigation,
  route: { params: RouteParams },
};

export default function SelectAccount({ navigation, route }: Props) {
  const currency = route.params.currency;
  const allAccounts = useSelector(flattenAccountsSelector);
  const accounts = useSelector(accountsSelector);

  const keyExtractor = item => item.account.id;
  const renderItem = useCallback(
    ({ item: result }: { item: SearchResult }) => {
      const { account } = result;
      return (
        <View
          style={account.type === "Account" ? undefined : styles.tokenCardStyle}
        >
          <AccountCard
            disabled={!result.match}
            account={account}
            style={styles.card}
            onPress={() => {
              navigation.navigate("ExchangeConnectDevice", {
                accountId: account.id,
                mode: "buy",
                parentId:
                  account.type !== "Account" ? account.parentId : undefined,
              });
            }}
          />
        </View>
      );
    },
    [navigation],
  );

  const renderList = useCallback(
    items => {
      const elligibleAccountsForSelectedCurrency = items.filter(
        account =>
          (account.type === "TokenAccount"
            ? account.token.id
            : account.currency.id) === currency.id,
      );
      const formatedList = formatSearchResults(
        elligibleAccountsForSelectedCurrency,
        accounts,
      );

      return (
        <FlatList
          data={formatedList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      );
    },
    [accounts, currency.id, navigation, renderItem],
  );

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="ReceiveFunds" name="SelectAccount" />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.card}
            list={allAccounts}
            renderList={renderList}
            renderEmptySearch={() => (
              <View style={styles.emptyResults}>
                <LText style={styles.emptyText}>
                  <Trans i18nKey="transfer.receive.noAccount" />
                </LText>
              </View>
            )}
          />
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
    backgroundColor: colors.white,
  },
  tokenCardStyle: {
    marginLeft: 26,
    paddingLeft: 7,
    borderLeftWidth: 1,
    borderLeftColor: colors.fog,
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
    color: colors.fog,
  },
});
