/* @flow */
import React from "react";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/bridge/RippleJSBridge";

import RippleFeeRow from "./RippleFeeRow";

type Props = {
  transaction: Transaction,
  account: Account | TokenAccount,
  navigation: NavigationScreenProp<*>,
};
export default function RippleSendRowsFee({ account, ...props }: Props) {
  if (account.type === "TokenAccount") return null;

  return <RippleFeeRow {...props} account={account} />;
}
