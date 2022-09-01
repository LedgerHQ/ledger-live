import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/ripple/types";
import SendRowTag from "./SendRowTag";

type Props = {
  transaction: Transaction;
  account: Account;
  navigation: any;
};
export default function RippleSendRowsCustom(props: Props) {
  const { transaction, ...rest } = props;
  return (
    <SendRowTag {...rest} transaction={transaction as RippleTransaction} />
  );
}
