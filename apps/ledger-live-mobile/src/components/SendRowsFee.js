/* @flow */
import React from "react";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import type { RouteParams } from "../screens/SendFunds/04-Summary";

import perFamily from "../generated/SendRowsFee";

export default ({
  transaction,
  account,
  parentAccount,
  navigation,
  route,
  setTransaction,
}: {
  transaction: any,
  account: AccountLike,
  parentAccount: ?Account,
  navigation: any,
  route: { params: RouteParams },
  setTransaction: Function,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const C = perFamily[mainAccount.currency.family];
  // FIXME: looks like a hack, need to find how to handle networkInfo properly
  return C && transaction?.networkInfo ? (
    <C
      setTransaction={setTransaction}
      transaction={transaction}
      account={account}
      parentAccount={parentAccount}
      navigation={navigation}
      route={route}
    />
  ) : null;
};
