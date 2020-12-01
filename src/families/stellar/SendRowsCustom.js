/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/stellar/types";

import SendRowMemo from "./SendRowMemo";

type Props = {
  transaction: Transaction,
  account: Account,
};
export default function StellarSendRowsCustom(props: Props) {
  return (
    <>
      <SendRowMemo {...props} />
    </>
  );
}
