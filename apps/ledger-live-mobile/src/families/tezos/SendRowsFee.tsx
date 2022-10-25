import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/tezos/types";
import TezosFeeRow from "./TezosFeeRow";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  navigation: any;
};
export default function TezosSendRowsFee({ account, ...props }: Props) {
  return <TezosFeeRow {...props} account={account} />;
}
