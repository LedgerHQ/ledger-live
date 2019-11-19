/* @flow */
import React from "react";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import perFamily from "../generated/SendRowsFee";

export default ({
  transaction,
  account,
  parentAccount,
  navigation,
}: {
  transaction: *,
  account: AccountLike,
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
