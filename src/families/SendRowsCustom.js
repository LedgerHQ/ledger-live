/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import ripple from "./ripple/SendRowsCustom";

const perFamily: { [_: string]: * } = {
  ripple,
};

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
