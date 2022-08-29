import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/ripple/types";
import RippleFeeRow from "./RippleFeeRow";

type Props = {
  transaction: Transaction;
  account: AccountLike;
};
export default function RippleSendRowsFee(props: Props) {
  if (props.account.type !== "Account") return null;
  return <RippleFeeRow {...props} />;
}
