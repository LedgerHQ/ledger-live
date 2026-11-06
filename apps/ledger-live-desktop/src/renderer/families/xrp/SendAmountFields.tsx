import type { TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import React from "react";
import ErrorBanner from "~/renderer/components/ErrorBanner";

// The amount step shows only `errors.amount` but blocks on any error, and the dry run that starts
// once an amount is set files its errors under `recipient` and `transaction`
const Root = (props: { status: TransactionStatus }) => {
  const { recipient, transaction } = props.status.errors;

  return (
    <>
      {recipient ? <ErrorBanner error={recipient} /> : null}
      {transaction ? <ErrorBanner error={transaction} /> : null}
    </>
  );
};

export default {
  component: Root,
};
