import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/ripple/types";
import SendRowTag from "./SendRowTag";

type Props = {
  transaction: Transaction;
  account: Account;
  navigation: any;
};
export default function RippleSendRowsCustom(props: Props) {
  return <SendRowTag {...props} />;
}
