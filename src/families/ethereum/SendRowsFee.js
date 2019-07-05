/* @flow */
import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import type { Transaction } from "@ledgerhq/live-common/lib/bridge/EthereumJSBridge";

import EthereumFeeRow from "./EthereumFeeRow";

type Props = {
  transaction: Transaction,
  account: Account | TokenAccount,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<*>,
};
export default function EthereumSendRowsFee(props: Props) {
  return <EthereumFeeRow {...props} />;
}
