/* @flow */
import React from "react";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";

import BitcoinFeePerByteRow from "./BitcoinFeePerByteRow";

type Props = {
  transaction: *,
  account: Account | TokenAccount,
  navigation: NavigationScreenProp<*>,
};

export default function BitcoinSendRowsFee({ account, ...props }: Props) {
  if (account.type === "TokenAccount") return null;

  return <BitcoinFeePerByteRow {...props} account={account} />;
}
