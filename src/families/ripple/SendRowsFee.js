/* @flow */
import React from "react";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/bridge/RippleJSBridge";

import RippleFeeRow from "./RippleFeeRow";

type Props = {
  transaction: Transaction,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function RippleSendRowsFee(props: Props) {
  return <RippleFeeRow {...props} />;
}
