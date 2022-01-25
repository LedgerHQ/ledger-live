/* @flow */
import React from "react";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/stellar/types";
import StellarFeeRow from "./StellarFeeRow";

type Props = {
  transaction: Transaction,
  account: AccountLike,
};
export default function StellarSendRowsFee({ account, ...props }: Props) {
  return <StellarFeeRow {...props} account={account} />;
}
