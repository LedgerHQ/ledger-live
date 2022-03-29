import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/live-common/lib/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { useTheme } from "styled-components/native";

import AccountList from "./AccountList";
import FilteredSearchBar from "./FilteredSearchBar";
import { formatSearchResults } from "../helpers/formatAccountSearchResults";
import { accountsSelector } from "../reducers/accounts";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];

type Props = {
  list: AccountLike[];
  onSelectAccount: (account: AccountLike) => void;
  showAddAccount?: boolean;
  onAddAccount?: () => void;
  initialCurrencySelected?: string;
};

const AccountSelector = ({
  list,
  onSelectAccount,
  showAddAccount,
  onAddAccount,
  initialCurrencySelected,
}: Props) => {
  const { colors } = useTheme();
  const accounts = useSelector(accountsSelector);

  const renderList = useCallback(
    items => {
      const formatedList = formatSearchResults(items, accounts);

      return (
        <AccountList
          list={formatedList}
          showAddAccount={showAddAccount}
          onPress={onSelectAccount}
          onAddAccount={onAddAccount}
        />
      );
    },
    [showAddAccount, onSelectAccount, onAddAccount, accounts],
  );

  return (
    <FilteredSearchBar
      keys={SEARCH_KEYS}
      list={list}
      renderList={renderList}
      initialQuery={initialCurrencySelected}
      renderEmptySearch={() => (
        <Flex
          flex={1}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={16} color={colors.primary.c50}>
            <Trans i18nKey="transfer.receive.noAccount" />
          </Text>
        </Flex>
      )}
    />
  );
};

export default AccountSelector;
