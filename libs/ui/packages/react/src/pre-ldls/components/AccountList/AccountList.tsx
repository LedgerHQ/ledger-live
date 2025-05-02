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
    balance: string;
    fiatValue: string;
    protocol: string;
    address: string;
    ticker: string;
    cryptoId: string;
  }[];
  onClick: (networkId: string) => void;
}) => {
  return (
    <VirtualList
      itemHeight={68}
      count={accounts.length}
      renderItem={(i: number) => (
        <AccountItem
          name={accounts[i].name}
          onClick={() => onClick(accounts[i].id)}
          balance={accounts[i].balance}
          fiatValue={accounts[i].fiatValue}
          protocol={accounts[i].protocol}
          address={accounts[i].address}
          cryptoId={accounts[i].cryptoId}
          ticker={accounts[i].ticker}
        />
      )}
    />
  );
};
