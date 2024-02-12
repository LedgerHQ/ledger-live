import React, { useCallback, useMemo } from "react";
import { StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Flex, IconsLegacy, Text, BoxedIcon } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, flattenAccounts } from "@ledgerhq/live-common/account/index";
import { accountWithMandatoryTokens } from "@ledgerhq/live-common/account/helpers";
import { TrackScreen, useAnalytics } from "~/analytics";
import AccountCard from "~/components/AccountCard";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import KeyboardView from "~/components/KeyboardView";
import { formatSearchResults, SearchResult } from "~/helpers/formatAccountSearchResults";
import { SelectAccountParamList } from "../types";
import { NavigatorName, ScreenName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import { sharedSwapTracking } from "../utils";

export function SelectAccount({ navigation, route: { params } }: SelectAccountParamList) {
  const { provider, target, selectableCurrencyIds, selectedCurrency } = params;

  const { track } = useAnalytics();
  const unfilteredAccounts = useSelector(accountsSelector);

  const accounts: Account[] = useMemo(
    () =>
      unfilteredAccounts.filter(acc => selectableCurrencyIds.includes(getAccountCurrency(acc).id)),
    [selectableCurrencyIds, unfilteredAccounts],
  );

  const enhancedAccounts = useMemo(() => {
    if (!selectedCurrency) {
      return accounts.map(acc => accountWithMandatoryTokens(acc, []));
    }

    const filteredAccounts = accounts.filter(
      acc =>
        acc.currency.id ===
        (selectedCurrency.type === "TokenCurrency"
          ? selectedCurrency.parentCurrency.id
          : selectedCurrency.id),
    );
    if (selectedCurrency.type === "TokenCurrency") {
      return filteredAccounts.map(acc => accountWithMandatoryTokens(acc, [selectedCurrency]));
    }
    return filteredAccounts;
  }, [accounts, selectedCurrency]);

  const allAccounts = useMemo(() => {
    const accounts: AccountLike[] = flattenAccounts(enhancedAccounts);

    if (target === "to") {
      return accounts
        .filter(a => {
          const c = getAccountCurrency(a);
          return c.type === "CryptoCurrency" || c.id === selectedCurrency.id;
        })
        .map(a => {
          const c = getAccountCurrency(a);
          return {
            ...a,
            disabled:
              (selectedCurrency.type === "TokenCurrency" && c.type === "CryptoCurrency") ||
              c.id !== selectedCurrency.id,
          };
        });
    }

    return accounts.map(a => ({
      ...a,
      disabled: !a.balance.gt(0) || !selectableCurrencyIds.includes(getAccountCurrency(a).id),
    }));
  }, [target, selectedCurrency, enhancedAccounts, selectableCurrencyIds]);

  const { t } = useTranslation();
  const { colors } = useTheme();

  const onSelect = useCallback(
    (account: AccountLike) => {
      // @ts-expect-error navigation type is only partially declared
      navigation.navigate(ScreenName.SwapForm, {
        accountId: account.id,
        currency: selectedCurrency,
        target,
      });
    },
    [navigation, target, selectedCurrency],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      const styleProps =
        item.account.type === "TokenAccount"
          ? {
              marginLeft: 8,
              borderLeftWidth: 1,
              borderColor: "neutral.c60",
            }
          : {};

      return (
        <Flex {...styleProps}>
          <AccountCard
            disabled={item.account.disabled}
            account={item.account}
            style={styles.card}
            onPress={() => onSelect(item.account)}
          />
        </Flex>
      );
    },
    [onSelect],
  );

  const onAddAccount = useCallback(() => {
    track("button_clicked", {
      ...sharedSwapTracking,
      account: "account",
      button: "new source account",
    });
    // @ts-expect-error navigation type is only partially declared
    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AddAccountsSelectCrypto,
      params: {
        returnToSwap: true,
        filterCurrencyIds: selectableCurrencyIds,
        onSuccess: () => {
          navigation.navigate(ScreenName.SwapSelectAccount, params);
        },
        analyticsPropertyFlow: "swap",
      },
    });
  }, [navigation, params, selectableCurrencyIds, track]);

  const renderList = useCallback(
    (items: typeof allAccounts) => {
      const formatedList = formatSearchResults(items, accounts);
      return (
        <FlatList
          data={formatedList}
          renderItem={renderItem}
          keyExtractor={(item: { account: AccountLike }) => item.account.id}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          ListFooterComponent={() => (
            <TouchableOpacity onPress={onAddAccount}>
              <Flex
                flexDirection="row"
                alignItems="center"
                marginLeft={6}
                paddingTop={4}
                paddingBottom={100}
              >
                <BoxedIcon
                  size={24}
                  Icon={<IconsLegacy.PlusMedium size={14} color={colors.primary} />}
                  variant="circle"
                  backgroundColor="primary.c20"
                  borderColor="transparent"
                />

                <Text paddingLeft={4} color={colors.primary}>
                  {t("transfer.swap.emptyState.CTAButton")}
                </Text>
              </Flex>
            </TouchableOpacity>
          )}
        />
      );
    },
    [accounts, renderItem, t, onAddAccount, colors],
  );

  return (
    <KeyboardView>
      <TrackScreen category="Swap Form" name="Edit Source Account" provider={provider} />
      <FilteredSearchBar
        keys={["name", "unit.code", "token.name", "token.ticker"]}
        inputWrapperStyle={[styles.searchBarContainer]}
        list={allAccounts}
        renderList={renderList}
        renderEmptySearch={() => (
          <Flex padding={4} alignItems="center">
            <Text>{t("transfer.receive.noAccount")}</Text>
          </Flex>
        )}
      />
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
