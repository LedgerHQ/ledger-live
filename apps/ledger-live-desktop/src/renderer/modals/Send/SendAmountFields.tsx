import React from "react";
import { Account, FeeStrategy } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import byFamily from "~/renderer/generated/SendAmountFields";
type Props = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  updateTransaction: (updater: any) => void;
  mapStrategies?: (
    a: FeeStrategy,
  ) => FeeStrategy & {
    [x: string]: any;
  };
};
const AmountRelatedField = (props: Props) => {
  const module = byFamily[props.account.currency.family];
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};
export default AmountRelatedField;
