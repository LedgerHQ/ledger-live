/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import BitcoinFeePerByteRow from "./BitcoinFeePerByteRow";

type Props = {
  transaction: *,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function BitcoinSendRowsFee(props: Props) {
  return <BitcoinFeePerByteRow {...props} />;
}
