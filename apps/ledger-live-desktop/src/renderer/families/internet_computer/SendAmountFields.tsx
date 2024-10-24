import React from "react";
import { Trans } from "react-i18next";
import MemoField from "./MemoField";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Account } from "@ledgerhq/types-live";

const Root = (props: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
}) => {
  return <MemoField {...props} />;
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  fields: ["memo", "transaction"],
};
