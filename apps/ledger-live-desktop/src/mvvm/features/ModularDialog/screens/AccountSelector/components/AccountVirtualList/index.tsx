import React, { useCallback } from "react";
import { Account, AccountListItem } from "../AccountListItem";
import { VirtualList } from "LLD/components/VirtualList";

export const AccountVirtualList = ({
  accounts,
  onClick,
  bottomComponent,
  getTitleDecoration,
}: {
  accounts: Account[];
  onClick: (accountId: string) => void;
  bottomComponent?: React.ReactNode;
  getTitleDecoration?: (account: Account) => React.ReactNode;
}) => {
  const renderAccountListItem = useCallback(
    (account: Account) => (
      <AccountListItem
        onClick={() => onClick(account.id)}
        account={account}
        titleDecoration={getTitleDecoration?.(account)}
      />
    ),
    [onClick, getTitleDecoration],
  );

  return (
    <VirtualList
      items={accounts}
      itemHeight={64}
      bottomComponent={bottomComponent}
      renderItem={renderAccountListItem}
      className="pb-40"
    />
  );
};
