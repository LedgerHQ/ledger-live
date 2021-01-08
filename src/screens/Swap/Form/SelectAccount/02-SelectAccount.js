/* @flow */

import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import type {
  Account,
  AccountLikeArray,
} from "@ledgerhq/live-common/lib/types";
import { useSelector } from "react-redux";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
} from "@ledgerhq/live-common/lib/account/helpers";
import type { SwapRouteParams } from "..";
import { accountsSelector } from "../../../../reducers/accounts";
import NoAccountsEmptyState from "./NoAccountsEmptyState";
import colors from "../../../../colors";
import { TrackScreen } from "../../../../analytics";
import LText from "../../../../components/LText";
import FilteredSearchBar from "../../../../components/FilteredSearchBar";
import AccountCard from "../../../../components/AccountCard";
import KeyboardView from "../../../../components/KeyboardView";
import { formatSearchResults } from "../../../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../../../helpers/formatAccountSearchResults";
import { ScreenName } from "../../../../const";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: any,
  route: { params: SwapRouteParams },
};

export default function SelectAccount({ navigation, route }: Props) {
  const { exchange, target, selectedCurrency } = route.params;
  const accounts = useSelector(accountsSelector);

  const enhancedAccounts = useMemo(() => {
    const filteredAccounts = accounts.filter(
      acc =>
        acc.currency.id ===
        (selectedCurrency.type === "TokenCurrency"
          ? selectedCurrency.parentCurrency.id
          : selectedCurrency.id),
    );
    if (selectedCurrency.type === "TokenCurrency") {
      return filteredAccounts.map(acc =>
        accountWithMandatoryTokens(acc, [selectedCurrency]),
      );
    }
    return filteredAccounts;
  }, [accounts, selectedCurrency]);

  const allAccounts = flattenAccounts(enhancedAccounts);

  const keyExtractor = item => item.account.id;
  const isFrom = target === "from";

  const renderItem = useCallback(
    ({ item: result }: { item: SearchResult }) => {
      const { account } = result;
      const parentAccount =
        account.type === "TokenAccount"
          ? accounts.find(a => a.id === account.parentId)
          : null;
      const accountParams = isFrom
        ? {
            fromAccount: account,
            fromParentAccount: parentAccount,
          }
        : {
            toAccount: account,
            toParentAccount: parentAccount,
          };

      return (
        <View
          style={account.type === "Account" ? undefined : styles.tokenCardStyle}
        >
          <AccountCard
            disabled={!result.match}
            account={account}
            style={styles.card}
            onPress={() => {
              navigation.navigate(ScreenName.SwapForm, {
                ...route.params,
                exchange: {
                  ...exchange,
                  ...accountParams,
                },
              });
            }}
          />
        </View>
      );
    },
    [accounts, isFrom, navigation, route.params, exchange],
  );

  const elligibleAccountsForSelectedCurrency = allAccounts.filter(
    account =>
      (isFrom ? account.balance.gt(0) : true) &&
      (account.type === "TokenAccount"
        ? account.token.id
        : account.currency.id) === selectedCurrency.id,
  );

  const renderList = useCallback(
    items => {
      const formatedList = formatSearchResults(items, enhancedAccounts);
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
    [enhancedAccounts, renderItem],
  );

  if (!elligibleAccountsForSelectedCurrency.length) {
    return <NoAccountsEmptyState selectedCurrency={selectedCurrency} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen category="ReceiveFunds" name="SelectAccount" />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.card}
            list={elligibleAccountsForSelectedCurrency}
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
  emptyStateBody: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 50,
    backgroundColor: colors.lightLive,
    marginBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: 16,
    color: colors.smoke,
    fontSize: 14,
  },
  buttonContainer: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
  addButton: {
    marginTop: 16,
    paddingLeft: 8,
    alignItems: "flex-start",
  },
});
