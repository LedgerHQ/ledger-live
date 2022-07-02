import React, { useCallback } from "react";
import { StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import {
  Account,
  TokenAccount,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import { TrackScreen } from "../../analytics";
import AccountCard from "../../components/AccountCard";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import KeyboardView from "../../components/KeyboardView";
import {
  formatSearchResults,
  SearchResult,
} from "../../helpers/formatAccountSearchResults";
import { SelectAccountProps } from "./types";

export function SelectAccount({
  navigation,
  route: {
    params: { accounts, target, provider, account, currencies },
  },
}: SelectAccountProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const onSelect = useCallback(
    (account: Account | TokenAccount) => {
      navigation.navigate("SwapForm", { account });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <Flex>
        <AccountCard
          disabled={!item.match}
          account={item.account}
          style={styles.card}
          onPress={() => onSelect(item.account)}
        />
      </Flex>
    ),
    [onSelect],
  );

  const onAddAccount = useCallback(() => {}, []);

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
              <Flex>
                <Icons.PlusRegular size={14} color={colors.primary} />
                {/* <AddIcon size={14} color={colors.live} /> */}
                <Text>{t("transfer.swap.emptyState.CTAButton")}</Text>
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
        name={`Edit ${target === "from" ? "Source" : "Target"} Account`}
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
