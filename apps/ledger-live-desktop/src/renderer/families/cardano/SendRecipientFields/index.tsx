import React from "react";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";

import MemoField from "./MemoField";

const Root = (props: {
  account: CardanoAccount;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (t: Transaction) => void;
  trackProperties?: Record<string, unknown>;
}) => {
  return (
    <>
      <MemoField {...props} />
    </>
  );
};

export default {
  component: Root,
  fields: ["memo"],
};
