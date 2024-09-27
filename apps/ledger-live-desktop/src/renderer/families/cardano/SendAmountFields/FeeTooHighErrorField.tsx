import React from "react";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";

const FeeTooHighErrorField = (props: {
  account: CardanoAccount;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (t: Transaction) => void;
  trackProperties?: Record<string, unknown>;
}) => {
  const { feeTooHigh } = props.status.errors;
  return <>{feeTooHigh ? <ErrorBanner error={feeTooHigh} /> : null}</>;
};

export default FeeTooHighErrorField;
