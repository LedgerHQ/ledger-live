import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { RouteParams } from "../screens/SendFunds/04-Summary";
import perFamily from "../generated/SendRowsFee";

export default ({
  transaction,
  account,
  parentAccount,
  navigation,
  route,
  setTransaction,
  ...props
}: {
  transaction: any;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  navigation: any;
  route: {
    params: RouteParams;
  };
  setTransaction: (..._: Array<any>) => any;
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const C = perFamily[mainAccount.currency.family];
  // FIXME: looks like a hack, need to find how to handle networkInfo properly
  return C && transaction?.networkInfo ? (
    <C
      {...props}
      setTransaction={setTransaction}
      transaction={transaction}
      account={account}
      parentAccount={parentAccount}
      navigation={navigation}
      route={route}
    />
  ) : null;
};
