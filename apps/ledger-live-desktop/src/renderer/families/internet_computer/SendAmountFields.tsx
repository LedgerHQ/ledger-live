import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Account } from "@ledgerhq/types-live";
import { useFeature } from "@features/platform-feature-flags";
import React from "react";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import MemoField from "./MemoField";

const Root = (props: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
}) => {
  const lldMemoTag = useFeature("lldMemoTag");
  // The bridge files staking notices under `warnings.staking`, a slot the generic send flow does not
  // render — it reads `warnings.amount` and `warnings.transaction` only. This is the family's own
  // amount-step slot, so it is where the notice can actually reach the user.
  const staking = props.status.warnings?.staking;

  return (
    <>
      {staking ? <ErrorBanner error={staking} warning dataTestId="icp-staking-warning" /> : null}
      {lldMemoTag?.enabled ? null : <MemoField {...props} />}
    </>
  );
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  fields: ["memo", "transaction"],
};
