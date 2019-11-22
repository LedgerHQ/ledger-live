/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import perFamily from "../generated/SendRowsCustom";

export default ({
  transaction,
  account,
  navigation,
}: {
  transaction: *,
  account: Account,
  navigation: NavigationScreenProp<*>,
}) => {
  const C = perFamily[account.currency.family];
  return C ? (
    <C transaction={transaction} account={account} navigation={navigation} />
  ) : null;
};
