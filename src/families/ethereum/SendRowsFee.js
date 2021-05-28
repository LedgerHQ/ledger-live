/* @flow */
import React from "react";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import type { RouteParams } from "../../screens/SendFunds/04-Summary";
import EthereumFeesStrategy from "./EthereumFeesStrategy";

type Props = {
  transaction: Transaction,
  account: AccountLike,
  parentAccount: ?Account,
  navigation: *,
  route: { params: RouteParams },
  setTransaction: Function,
};
export default function EthereumSendRowsFee(props: Props) {
  return <EthereumFeesStrategy {...props} />;
}
