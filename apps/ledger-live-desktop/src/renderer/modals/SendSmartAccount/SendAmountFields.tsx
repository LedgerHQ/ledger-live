import React from "react";
import { Account, FeeStrategy, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getLLDCoinFamily } from "~/renderer/families";

export type SendAmountFieldsProps = {
  account: Account;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  updateTransaction: (updater: (_: Transaction) => Transaction) => void;
  mapStrategies?: (a: FeeStrategy) => FeeStrategy;
  bridgePending?: boolean;
  trackProperties?: Record<string, unknown>;
  transactionToUpdate?: Transaction;
  disableSlowStrategy?: boolean;
};

const AmountRelatedField = (props: SendAmountFieldsProps) => {
  const module = getLLDCoinFamily<Account, Transaction, TransactionStatus, Operation>(
    props.account.currency.family,
  )?.sendAmountFields;
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default AmountRelatedField;
