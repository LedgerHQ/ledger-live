/* @flow */
import React from "react";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import BitcoinFeePerByteRow from "./BitcoinFeePerByteRow";

type Props = {
  transaction: *,
  account: AccountLike,
  navigation: NavigationScreenProp<*>,
};

export default function BitcoinSendRowsFee({ account, ...props }: Props) {
  if (account.type !== "Account") return null;

  return <BitcoinFeePerByteRow {...props} account={account} />;
}
