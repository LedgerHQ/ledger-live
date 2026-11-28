import React from "react";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import type { XrpFamily } from "./types";

// The amount step shows only `errors.amount`, but any error blocks it: a dry-run rejection lands
// on `recipient` or `transaction` once an amount is set
const SendAmountFields: NonNullable<XrpFamily["sendAmountFields"]>["component"] = props => {
  const error = props.status.errors.recipient ?? props.status.errors.transaction;

  return error ? <ErrorBanner error={error} dataTestId="xrp-send-amount-error" /> : null;
};

export default {
  component: SendAmountFields,
  fields: ["recipient", "transaction"],
};
