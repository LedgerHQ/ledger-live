/* @flow */
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
} from "@ledgerhq/live-common/lib/account/helpers";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";

import { accountsSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import KeyboardView from "../../components/KeyboardView";
import { formatSearchResults } from "../../helpers/formatAccountSearchResults";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];
const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: {
    params?: {
      currency?: string,
      selectedCurrency?: CryptoCurrency | TokenCurrency,
    },
  },
};

export default function ReceiveFunds({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { selectedCurrency, currency: initialCurrencySelected } =
    route.params || {};

  const accounts = useSelector(accountsSelector);
  const enhancedAccounts = useMemo(() => {
    if (selectedCurrency) {
      const filteredAccounts = accounts.filter(
        acc =>
          acc.currency.id ===
          (selectedCurrency.type === "TokenCurrency"
            ? selectedCurrency.parentCurrency.id
            : selectedCurrency.id),
      );
      if (selectedCurrency.type === "TokenCurrency") {
        // add in the token subAccount if it does not exist
        return flattenAccounts(
          filteredAccounts.map(acc =>
            accountWithMandatoryTokens(acc, [selectedCurrency]),
          ),
        ).filter(
          acc =>
            acc.type === "Account" ||
            (acc.type === "TokenAccount" &&
              acc.token.id === selectedCurrency.id),
        );
      }
      return flattenAccounts(filteredAccounts);
    }
    return flattenAccounts(accounts);
  }, [accounts, selectedCurrency]);
  const allAccounts = enhancedAccounts;

  const keyExtractor = item => item.account.id;

  const renderItem = useCallback(
    ({ item: result }: { item: SearchResult }) => {
      const { account } = result;
      return (
        <View
          style={
            account.type === "Account"
              ? undefined
              : [
                  styles.tokenCardStyle,
                  {
                    borderLeftColor: colors.fog,
                  },
                ]
          }
        >
          <AccountCard
            disabled={!result.match}
            account={account}
            style={styles.card}
            onPress={() => {
              navigation.navigate(ScreenName.ReceiveConnectDevice, {
                account,
                accountId: account.id,
                parentId:
                  account.type !== "Account" ? account.parentId : undefined,
              });
            }}
          />
        </View>
      );
    },
    [colors.fog, navigation],
  );

  const renderList = useCallback(
    items => {
      const formatedList = formatSearchResults(items, accounts);

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
    [accounts, renderItem],
  );

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
      forceInset={forceInset}
    >
      <TrackScreen category="ReceiveFunds" name="SelectAccount" />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.card}
            list={allAccounts}
            renderList={renderList}
            initialQuery={initialCurrencySelected}
            renderEmptySearch={() => (
              <View style={styles.emptyResults}>
                <LText style={styles.emptyText} color="fog">
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
});
