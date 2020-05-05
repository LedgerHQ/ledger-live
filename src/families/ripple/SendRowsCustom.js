/* @flow */
import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";

import SendRowTag from "./SendRowTag";

type Props = {
  transaction: Transaction,
  account: Account,
  navigation: *,
};
export default function RippleSendRowsCustom(props: Props) {
  return <SendRowTag {...props} />;
}
