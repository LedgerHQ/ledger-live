/* @flow */
import React from "react";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/stellar/types";

import SendRowMemo from "./SendRowMemo";

type Props = {
  transaction: Transaction,
  account: Account,
  navigation: NavigationScreenProp<*>,
};
export default function StellarSendRowsCustom(props: Props) {
  return (
    <>
      <SendRowMemo {...props} />
    </>
  );
}
