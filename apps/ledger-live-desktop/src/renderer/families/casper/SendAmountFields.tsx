import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";

import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import { Account } from "@ledgerhq/types-live";

import MemoValueField from "./MemoValueField";

type Props = {
  account: Account;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  trackProperties?: Record<string, unknown>;
};

const Root = (props: Props) => {
  return (
    <MemoValueField
      onChange={props.onChange}
      account={props.account}
      transaction={props.transaction}
      status={props.status}
    />
  );
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  fields: ["transferId", "transaction"],
};
