/* @flow */

import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import {
  accountWithMandatoryTokens,
  flattenAccounts,
} from "@ledgerhq/live-common/account/helpers";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";

import type { SearchResult } from "../../../helpers/formatAccountSearchResults";
import { accountsSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import LText from "../../../components/LText";
import FilteredSearchBar from "../../../components/FilteredSearchBar";
import AccountCard from "../../../components/AccountCard";
import KeyboardView from "../../../components/KeyboardView";
import { formatSearchResults } from "../../../helpers/formatAccountSearchResults";
import { NavigatorName, ScreenName } from "../../../const";

import type { SwapRouteParams } from "..";
import AddIcon from "../../../icons/Plus";
import { swapSelectableCurrenciesSelector } from "../../../reducers/settings";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];

type Props = {
  navigation: any,
  route: { params: SwapRouteParams },
};

export default function SelectAccount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { swap, target, selectedCurrency, setAccount, provider } = route.params;

  const unfilteredAccounts = useSelector(accountsSelector);
  const selectableCurrencies = useSelector(swapSelectableCurrenciesSelector);

  const accounts = useMemo(
    () =>
      unfilteredAccounts.filter(
        acc => acc && selectableCurrencies.includes(getAccountCurrency(acc).id),
      ),
    [selectableCurrencies, unfilteredAccounts],
  );

  const enhancedAccounts = useMemo(() => {
    if (!selectedCurrency)
      return accounts.map(acc => accountWithMandatoryTokens(acc, []));

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

  const allAccounts = selectedCurrency
    ? flattenAccounts(enhancedAccounts).filter(
        acc =>
          (acc.type === "TokenAccount" ? acc.token : acc.currency).id ===
          selectedCurrency.id,
      )
    : flattenAccounts(enhancedAccounts);

  const keyExtractor = item => item.account.id;
  const isFrom = target === "from";

  const renderItem = useCallback(
    ({ item: result }: { item: SearchResult }) => {
      const { account } = result;
      return (
        <View
          style={
            account.type === "Account"
              ? undefined
              : { ...styles.tokenCardStyle, borderLeftColor: colors.fog }
          }
        >
          <AccountCard
            disabled={!result.match}
            account={account}
            style={styles.card}
            onPress={() => {
              setAccount && setAccount(account);
              navigation.navigate(ScreenName.SwapForm, {
                ...route.params,
                transaction: undefined, // reset transaction after switching source account
                swap: {
                  ...route.params.swap,
                  from: {
                    ...(route.params.swap?.from || {}),
                    account,
                    parentAccount: null,
                  },
                },
              });
            }}
          />
        </View>
      );
    },
    [colors.fog, setAccount, navigation, route.params],
  );

  const elligibleAccountsForSelectedCurrency = allAccounts.filter(account =>
    isFrom ? account.balance.gt(0) : swap.from?.account?.id !== account.id,
  );

  const onAddAccount = useCallback(() => {
    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AddAccountsSelectCrypto,
      params: {
        returnToSwap: true,
        filterCurrencyIds: selectableCurrencies,
        onSuccess: () => {
          navigation.navigate(ScreenName.SwapV2FormSelectAccount, route.params);
        },
        analyticsPropertyFlow: "swap",
      },
    });
  }, [navigation, route.params, selectableCurrencies]);

  const renderList = useCallback(
    items => {
      // $FlowFixMe
      const formatedList = formatSearchResults(items, enhancedAccounts);
      return (
        <FlatList
          data={formatedList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          ListFooterComponent={() => (
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={onAddAccount}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.lightLive },
                ]}
              >
                <AddIcon size={14} color={colors.live} />
              </View>
              <LText color="live" semiBold style={styles.label}>
                <Trans i18nKey="transfer.swap.emptyState.CTAButton" />
              </LText>
            </TouchableOpacity>
          )}
        />
      );
    },
    [colors.lightLive, colors.live, enhancedAccounts, onAddAccount, renderItem],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Swap Form"
        name={`Edit ${isFrom ? "Source" : "Target"} Account`}
        provider={provider}
      />
      <KeyboardView style={styles.root}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={[styles.card, styles.searchBarContainer]}
            list={elligibleAccountsForSelectedCurrency}
            renderList={renderList}
            renderEmptySearch={() => (
              <View style={styles.emptyResults}>
                <LText style={styles.label} color="fog">
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
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  searchContainer: {
    paddingTop: 18,
    flex: 1,
  },
  searchBarContainer: {
    paddingBottom: 8,
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
  label: {
    fontSize: 16,
    lineHeight: 19,
  },
  button: {
    flex: 1,
  },
  iconContainer: {
    borderRadius: 26,
    height: 26,
    width: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  buttonContainer: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
});
