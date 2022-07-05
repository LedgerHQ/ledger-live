import React, { useCallback, useMemo } from "react";
import { StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Flex, Icons, Text, BoxedIcon } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { AccountLike } from "@ledgerhq/live-common/lib/types";
import { flattenAccounts } from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
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
import { shallowAccountsSelector } from "../../../reducers/accounts";

export function SelectAccount({
  navigation,
  route: {
    params: { accountIds, provider },
  },
}: {
  // TODO find proper prop for navigation
  navigation: SelectAccountProps["navigation"];
  route: SelectAccountProps["route"];
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const allAccounts = useSelector(shallowAccountsSelector);
  const accounts = useMemo(() => {
    const accounts = allAccounts.filter(a => accountIds.includes(a.id));
    return flattenAccounts(accounts, { enforceHideEmptySubAccounts: true });
  }, [accountIds, allAccounts]);

  const onSelect = useCallback(
    (account: AccountLike) => {
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
            disabled={!item.match}
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
    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AddAccountsSelectCrypto,
      params: {
        returnToSwap: true,
        // filterCurrencyIds: selectableCurrencies,
        onSuccess: () => {
          navigation.navigate("SelectAccount");
        },
        analyticsPropertyFlow: "swap",
      },
    });
  }, [navigation]);

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
            <Flex>
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
