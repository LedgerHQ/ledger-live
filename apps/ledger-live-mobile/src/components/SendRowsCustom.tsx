import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import perFamily from "../generated/SendRowsCustom";

export default ({
  transaction,
  account,
  navigation,
}: {
  transaction: Transaction;
  account: Account;
  navigation: any;
}) => {
  const C = perFamily[account.currency.family as keyof typeof perFamily];
  return C ? (
    <C transaction={transaction} account={account} navigation={navigation} />
  ) : null;
};
