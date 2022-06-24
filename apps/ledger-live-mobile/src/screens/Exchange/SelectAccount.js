/* @flow */

import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import type {
  Account,
  AccountLike,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { useSelector } from "react-redux";
import { accountWithMandatoryTokens } from "@ledgerhq/live-common/lib/account/helpers";
import { useTheme } from "@react-navigation/native";
import { Button, Icons } from "@ledgerhq/native-ui";
import { accountsSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import KeyboardView from "../../components/KeyboardView";
import { formatSearchResults } from "../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";
import InfoIcon from "../../icons/Info";
import { NavigatorName, ScreenName } from "../../const";
import { getAccountTuplesForCurrency } from "./hooks";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];

type Props = {
  navigation: any,
  route: {
    params: {
      mode: "buy" | "sell",
      currency: CryptoCurrency | TokenCurrency,
      onAccountChange: (selectedAccount: Account | AccountLike) => void,
      analyticsPropertyFlow?: string,
    },
  },
};

export default function SelectAccount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const {
    mode = "buy",
    currency,
    analyticsPropertyFlow,
    onAccountChange,
  } = route.params;

  const accounts = useSelector(accountsSelector);

  const availableAccounts = useMemo(
    () => (currency ? getAccountTuplesForCurrency(currency, accounts) : []),
    [currency, accounts],
  );

  const enhancedAccounts = useMemo(() => {
    const filteredAccounts = availableAccounts
      .map(t => t.account)
      .filter(
        acc =>
          acc &&
          acc.currency &&
          acc.currency.id ===
            (currency.type === "TokenCurrency"
              ? currency.parentCurrency.id
              : currency.id),
      );
    if (currency.type === "TokenCurrency") {
      return filteredAccounts.map(acc =>
        accountWithMandatoryTokens(acc, [currency]),
      );
    }
    return filteredAccounts;
  }, [availableAccounts, currency]);

  const allAccounts = useMemo(() => {
    const accounts = enhancedAccounts;
    if (currency.type === "TokenCurrency") {
      const subAccounts = availableAccounts.map(t => t.subAccount);

      for (let i = 0; i < subAccounts.length; i++) {
        accounts.push(subAccounts[i]);
      }
    }

    return accounts;
  }, [enhancedAccounts, currency.type, availableAccounts]);

  const { t } = useTranslation();

  const keyExtractor = item => item.account.id;
  const renderItem = useCallback(
    ({ item: result }: { item: SearchResult }) => {
      const { account } = result;
      return (
        <View
          style={
            account.type === "Account"
              ? undefined
              : [styles.tokenCardStyle, { borderLeftColor: colors.fog }]
          }
        >
          <AccountCard
            disabled={!result.match}
            account={account}
            style={styles.card}
            onPress={() => {
              onAccountChange && onAccountChange(account);
              navigation.navigate(NavigatorName.Exchange, {
                screen:
                  mode === "buy"
                    ? ScreenName.ExchangeBuy
                    : ScreenName.ExchangeSell,
              });
            }}
          />
        </View>
      );
    },
    [colors.fog, onAccountChange, navigation, mode],
  );

  const elligibleAccountsForSelectedCurrency = useMemo(
    () =>
      allAccounts.filter(
        account =>
          (account.type === "TokenAccount"
            ? account.token.id
            : account.currency.id) === currency.id,
      ),
    [allAccounts, currency.id],
  );

  const onAddAccount = useCallback(() => {
    if (currency && currency.type === "TokenCurrency") {
      navigation.navigate(NavigatorName.AddAccounts, {
        token: currency,
        analyticsPropertyFlow,
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        currency,
        analyticsPropertyFlow,
      });
    }
  }, [analyticsPropertyFlow, currency, navigation]);

  const renderList = useCallback(
    items => {
      // $FlowFixMe seriously WTF (60 errors just on this 😱)
      const formatedList = formatSearchResults(items, enhancedAccounts);
      return (
        <FlatList
          data={formatedList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Button
              event="ExchangeStartBuyFlow"
              type="main"
              Icon={Icons.PlusMedium}
              iconPosition="left"
              onPress={onAddAccount}
              mt={3}
            >
              <Trans i18nKey="exchange.buy.emptyState.CTAButton" />
            </Button>
          }
          keyboardDismissMode="on-drag"
        />
      );
    },
    [enhancedAccounts, renderItem, onAddAccount],
  );

  // empty state if no accounts available for this currency
  if (!elligibleAccountsForSelectedCurrency.length) {
    return (
      <View style={styles.emptyStateBody}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.lightLive }]}
        >
          <InfoIcon size={22} color={colors.live} />
        </View>
        <LText semiBold style={styles.title}>
          {t("exchange.buy.emptyState.title", { currency: currency.name })}
        </LText>
        <LText style={styles.description} color="smoke">
          {t("exchange.buy.emptyState.description", {
            currency: currency.name,
          })}
        </LText>
        <View style={styles.buttonContainer}>
          <Button
            event="ExchangeStartBuyFlow"
            type="main"
            onPress={onAddAccount}
          >
            <Trans i18nKey="exchange.buy.emptyState.CTAButton" />
          </Button>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
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
    backgroundColor: "transparent",
  },
  searchContainer: {
    padding: 16,
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
    marginBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: 16,
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
