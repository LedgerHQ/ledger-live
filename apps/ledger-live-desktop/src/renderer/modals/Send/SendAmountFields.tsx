import React from "react";
import { Account, FeeStrategy, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useLLDCoinFamily } from "~/renderer/families";

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
  disableEditGasLimit?: boolean;
};

const AmountRelatedField = (props: SendAmountFieldsProps) => {
  const specific = useLLDCoinFamily<Account, Transaction, TransactionStatus, Operation>(
    props.account.currency.family,
  );
  const module = specific?.sendAmountFields;
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default AmountRelatedField;
