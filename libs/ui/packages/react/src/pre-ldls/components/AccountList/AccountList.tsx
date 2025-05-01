import React from "react";
import { AccountItem } from "../AccountItem/AccountItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const AccountList = ({
  accounts,
  onClick,
}: {
  accounts: {
    name: string;
    id: string;
    ticker: string;
    balance: string;
    fiatValue: string;
    protocol: string;
    address: string;
  }[];
  onClick: (networkId: string) => void;
}) => {
  return (
    <VirtualList
      itemHeight={64}
      count={accounts.length}
      renderItem={(i: number) => (
        <AccountItem
          name={accounts[i].name}
          onClick={() => onClick(accounts[i].id)}
          ticker={accounts[i].ticker}
          balance={accounts[i].balance}
          fiatValue={accounts[i].fiatValue}
          protocol={accounts[i].protocol}
          address={accounts[i].address}
        />
      )}
    />
  );
};
