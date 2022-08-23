import React from "react";
import type { Account } from "@ledgerhq/types-live";
import perFamily from "../generated/SendRowsCustom";

export default ({
  transaction,
  account,
  navigation,
}: {
  transaction: any;
  account: Account;
  navigation: any;
}) => {
  const C = perFamily[account.currency.family];
  return C ? (
    <C transaction={transaction} account={account} navigation={navigation} />
  ) : null;
};
