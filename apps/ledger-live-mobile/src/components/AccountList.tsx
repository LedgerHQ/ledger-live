import React from "react";
import { FlatList } from "react-native";
import { useTheme } from "styled-components/native";
import { AccountLike } from "@ledgerhq/types-live";
import { Flex, Link } from "@ledgerhq/native-ui";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { Trans } from "react-i18next";

import { SearchResult } from "~/helpers/formatAccountSearchResults";
import AccountCard from "./AccountCard";

type Props = {
  list: SearchResult[];
  showAddAccount?: boolean;
  onPress: (_: AccountLike) => void;
  onAddAccount?: () => void;
};

const AccountList = ({ list, showAddAccount, onPress, onAddAccount }: Props): JSX.Element => {
  const keyExtractor = (item: SearchResult) => item.account.id;
  const { colors } = useTheme();

  const renderItem = ({ item: result }: { item: SearchResult }) => {
    const { account } = result;

    return (
      <Flex>
        <Flex
          width="1px"
          height="16px"
          marginLeft="16px"
          backgroundColor={account.type === "TokenAccount" ? colors.neutral.c40 : "transparent"}
        />
        <AccountCard
          account={account}
          disabled={!result.match}
          onPress={() => onPress(account)}
          py={2}
        />
      </Flex>
    );
  };

  const renderFooter = () => (
    <Flex alignItems="flex-start" mt={6}>
      {showAddAccount && (
        <Link
          type="color"
          size="medium"
          iconPosition="left"
          onPress={onAddAccount}
          Icon={() => (
            <Flex
              mr={2}
              bg="primary.c30"
              borderRadius={9999}
              width="32px"
              height="32px"
              alignItems="center"
              justifyContent="center"
            >
              <PlusMedium size={16} color="primary.c90" />
            </Flex>
          )}
        >
          <Trans i18nKey="addAccountsModal.ctaAdd" />
        </Link>
      )}
    </Flex>
  );

  return (
    <FlatList
      data={list}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      ListFooterComponent={renderFooter}
    />
  );
};

export default AccountList;
