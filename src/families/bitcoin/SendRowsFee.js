/* @flow */
import React from "react";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";

import BitcoinFeePerByteRow from "./BitcoinFeePerByteRow";

type Props = {
  transaction: any,
  account: AccountLike,
  navigation: any,
};

export default function BitcoinSendRowsFee({ account, ...props }: Props) {
  if (account.type !== "Account") return null;

  return <BitcoinFeePerByteRow {...props} account={account} />;
}
