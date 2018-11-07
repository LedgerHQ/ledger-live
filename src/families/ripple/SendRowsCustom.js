/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import SendRowTag from "./SendRowTag";

type Props = {
  transaction: *,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function RippleSendRowsCustom(props: Props) {
  return <SendRowTag {...props} />;
}
