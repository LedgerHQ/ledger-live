import React, { useCallback } from "react";
import { StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Flex, Icons, Text, BoxedIcon } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { AccountLike } from "@ledgerhq/live-common/types/index";
import { getAccountCurrency } from "@ledgerhq/live-common/src/account";
import { TrackScreen } from "../../../analytics";
import AccountCard from "../../../components/AccountCard";
import FilteredSearchBar from "../../../components/FilteredSearchBar";
import KeyboardView from "../../../components/KeyboardView";
import {
  formatSearchResults,
  SearchResult,
} from "../../../helpers/formatAccountSearchResults";
import { SelectAccountProps } from "../types";
import { NavigatorName, ScreenName } from "../../../const";

export function SelectAccount({
  navigation,
  route: { params },
}: SelectAccountProps) {
  const { accounts, provider, currencyIds } = params;
  const { t } = useTranslation();
  const { colors } = useTheme();

  const onSelect = useCallback(
    (account: AccountLike) => {
      // @ts-expect-error
      navigation.navigate("SwapForm", { accountId: account.id });
    },
    [navigation],
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
    // @ts-expect-error
    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AddAccountsSelectCrypto,
      params: {
        returnToSwap: true,
        filterCurrencyIds: currencyIds,
        onSuccess: ({ selected }: { selected: AccountLike[] }) => {
          const addedAccounts = selected.map(a => ({
            ...a,
            disabled: !currencyIds.includes(getAccountCurrency(a).id),
          }));

          navigation.navigate("SelectAccount", {
            ...params,
            accounts: [...params.accounts, ...addedAccounts],
          });
        },
        analyticsPropertyFlow: "swap",
      },
    });
  }, [navigation, currencyIds, params]);

  const renderList = useCallback(
    items => {
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
              >
                <BoxedIcon
                  size={24}
                  Icon={<Icons.PlusRegular size={14} color={colors.primary} />}
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
    // @ts-expect-error
    <KeyboardView>
      <TrackScreen
        category="Swap Form"
        name="Edit Source Account"
        provider={provider}
      />
      <Flex>
        <FilteredSearchBar
          keys={["name", "unit.code", "token.name", "token.ticker"]}
          inputWrapperStyle={[styles.card, styles.searchBarContainer]}
          list={accounts}
          renderList={renderList}
          renderEmptySearch={() => (
            <Flex padding={4} alignItems="center">
              <Text>{t("transfer.receive.noAccount")}</Text>
            </Flex>
          )}
        />
      </Flex>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  searchBarContainer: {
    paddingBottom: 8,
  },
});
