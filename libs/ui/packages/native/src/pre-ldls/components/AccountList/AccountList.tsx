import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { Account, AccountItem } from "../AccountItem/AccountItem";

const ITEM_HEIGHT = 76;

export const AccountList = ({
  accounts,
  onClick,
}: {
  accounts: Account[];
  onClick: (accountId: string) => void;
}) => {
  const renderAccountItem = useCallback(
    ({ item }: { item: Account }) => (
      <AccountItem onClick={() => onClick(item.id)} account={item} />
    ),
    [onClick],
  );

  const keyExtractor = useCallback((item: Account, index: number) => `${item.id}-${index}`, []);

  return (
    <FlatList
      data={accounts}
      renderItem={renderAccountItem}
      keyExtractor={keyExtractor}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
    />
  );
};
