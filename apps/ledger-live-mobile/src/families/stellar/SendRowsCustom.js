/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/types/index";
import type { Transaction } from "@ledgerhq/live-common/families/stellar/types";

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
