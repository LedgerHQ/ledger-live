import React from "react";
import MemoField from "./MemoField";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const Root = (props: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
}) => {
  const lldMemoTag = useFeature("lldMemoTag");

  if (lldMemoTag?.enabled) return null;

  return <MemoField {...props} />;
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  fields: ["memo", "transaction"],
};
