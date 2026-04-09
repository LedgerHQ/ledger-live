import React from "react";
import { Account, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useLLDCoinFamily } from "~/renderer/families";

type Props = {
  account: Account;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  bridgePending?: boolean;
};

const AmountRelatedField = (props: Props) => {
  const specific = useLLDCoinFamily<Account, Transaction, TransactionStatus, Operation>(
    props.account.currency.family,
  );
  const module = specific?.sendAmountFields;
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default AmountRelatedField;
