import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import SendRowMemo from "./SendRowMemo";

type Props = {
  transaction: Transaction;
  account: Account;
};
export default function StellarSendRowsCustom(props: Props) {
  const { transaction, ...rest } = props;
  return (
    <>
      <SendRowMemo {...rest} transaction={transaction as StellarTransaction} />
    </>
  );
}
