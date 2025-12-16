import React, { useCallback } from "react";
import { Account, AccountListItem } from "../AccountListItem";
import { VirtualList } from "LLD/components/VirtualList";

export const AccountVirtualList = ({
  accounts,
  onClick,
  bottomComponent,
}: {
  accounts: Account[];
  onClick: (accountId: string) => void;
  bottomComponent?: React.ReactNode;
}) => {
  const renderAccountListItem = useCallback(
    (account: Account) => <AccountListItem onClick={() => onClick(account.id)} account={account} />,
    [onClick],
  );

  return (
    <VirtualList
      items={accounts}
      itemHeight={76}
      bottomComponent={bottomComponent}
      renderItem={renderAccountListItem}
    />
  );
};
