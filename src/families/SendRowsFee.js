/* @flow */
import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";

import bitcoin from "./bitcoin/SendRowsFee";
import ripple from "./ripple/SendRowsFee";
import ethereum from "./ethereum/SendRowsFee";

// Update per currency family the rows component for fees if any
const perFamily: { [_: string]: * } = {
  bitcoin,
  ripple,
  ethereum,
};

export default ({
  transaction,
  account,
  parentAccount,
  navigation,
}: {
  transaction: *,
  account: Account | TokenAccount,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<*>,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const C = perFamily[mainAccount.currency.family];
  return C ? (
    <C
      transaction={transaction}
      account={account}
      parentAccount={parentAccount}
      navigation={navigation}
    />
  ) : null;
};
