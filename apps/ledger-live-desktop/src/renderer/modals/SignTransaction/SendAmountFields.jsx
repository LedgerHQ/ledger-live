// @flow
import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

import byFamily from "~/renderer/generated/SendAmountFields";

type Props = {
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
  onChange: Transaction => void,
  updateTransaction: (updater: any) => void,
};

const AmountRelatedField = (props: Props) => {
  const module = byFamily[props.account.currency.family];
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default AmountRelatedField;
