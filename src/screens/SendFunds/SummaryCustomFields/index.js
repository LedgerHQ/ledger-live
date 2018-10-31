/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import Ripple from "./Ripple";

const customFieldsPerFamily: { [_: string]: * } = {
  ripple: Ripple,
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
  const C = customFieldsPerFamily[account.currency.family];
  return C ? (
    <C transaction={transaction} account={account} navigation={navigation} />
  ) : null;
};
