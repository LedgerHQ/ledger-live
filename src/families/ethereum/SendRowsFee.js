/* @flow */
import React from "react";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";

import EthereumFeeRow from "./EthereumFeeRow";

type Props = {
  transaction: Transaction,
  account: AccountLike,
  parentAccount: ?Account,
  navigation: *,
};
export default function EthereumSendRowsFee(props: Props) {
  return <EthereumFeeRow {...props} />;
}
