/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import RippleFeeRow from "./RippleFeeRow";

type Props = {
  transaction: *,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function RippleSendRowsFee(props: Props) {
  return <RippleFeeRow {...props} />;
}
