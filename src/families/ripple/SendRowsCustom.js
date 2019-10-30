/* @flow */
import React from "react";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";

import SendRowTag from "./SendRowTag";

type Props = {
  transaction: Transaction,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function RippleSendRowsCustom(props: Props) {
  return <SendRowTag {...props} />;
}
