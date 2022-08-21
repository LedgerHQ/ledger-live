import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/stellar/types";
import SendRowMemo from "./SendRowMemo";

type Props = {
  transaction: Transaction;
  account: Account;
};
export default function StellarSendRowsCustom(props: Props) {
  return (
    <>
      <SendRowMemo {...props} />
    </>
  );
}
