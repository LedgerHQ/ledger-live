import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import type { RouteParams } from "../../screens/SendFunds/04-Summary";
import EthereumFeesStrategy from "./EthereumFeesStrategy";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  navigation: any;
  route: {
    params: RouteParams;
  };
  setTransaction: (..._: Array<any>) => any;
};
export default function EthereumSendRowsFee(props: Props) {
  return <EthereumFeesStrategy {...props} />;
}
