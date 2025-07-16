import React, { useCallback } from "react";
import { Account, AccountItem } from "../AccountItem/AccountItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const AccountList = ({
  accounts,
  onClick,
}: {
  accounts: Account[];
  onClick: (networkId: string) => void;
}) => {
  const renderAccountItem = useCallback(
    (account: Account) => <AccountItem onClick={() => onClick(account.id)} account={account} />,
    [onClick],
  );

  return <VirtualList items={accounts} itemHeight={68} renderItem={renderAccountItem} />;
};
