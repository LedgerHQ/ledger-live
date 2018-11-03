/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import bitcoin from "./bitcoin/SendRowsFee";
import ripple from "./ripple/SendRowsFee";

// Update per currency family the rows component for fees if any
const perFamily: { [_: string]: * } = {
  bitcoin,
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
