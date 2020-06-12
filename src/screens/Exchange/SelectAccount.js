/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
// $FlowFixMe
import SafeAreaView from "react-native-safe-area-view";
import { Trans, useTranslation } from "react-i18next";
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
import InfoIcon from "../../icons/Info";
import Button from "../../components/Button";
import { NavigatorName } from "../../const";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];
const forceInset = { bottom: "always" };

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: any,
  // TODO: add proper type
  route: { params: any },
};

export default function SelectAccount({ navigation, route }: Props) {
  const currency = route.params.currency;
  const allAccounts = useSelector(flattenAccountsSelector);
  const accounts = useSelector(accountsSelector);
  const { t } = useTranslation();

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

  const elligibleAccountsForSelectedCurrency = allAccounts.filter(
    account =>
      (account.type === "TokenAccount"
        ? account.token.id
        : account.currency.id) === currency.id,
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

  // empty state if no accounts available for this currency
  if (!elligibleAccountsForSelectedCurrency.length) {
    return (
      <View style={styles.emptyStateBody}>
        <View style={styles.iconContainer}>
          <InfoIcon size={22} color={colors.live} />
        </View>
        <LText style={styles.title}>
          {t("exchange.buy.emptyState.title", { currency: currency.name })}
        </LText>
        <LText style={styles.description}>
          {t("exchange.buy.emptyState.description", {
            currency: currency.name,
          })}
        </LText>
        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.button}
            event="ExchangeStartBuyFlow"
            type="primary"
            title={t("exchange.buy.emptyState.CTAButton")}
            onPress={() =>
              navigation.navigate(NavigatorName.AddAccounts, {
                currency,
              })
            }
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
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
});
