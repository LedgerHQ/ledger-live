/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import type { Transaction } from "../../bridge/EthereumJSBridge";

import SendRowGasLimit from "./SendRowGasLimit";

type Props = {
  transaction: Transaction,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function RippleSendRowsCustom(props: Props) {
  return <SendRowGasLimit {...props} />;
}
