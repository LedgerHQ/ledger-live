import React from "react";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getLLDCoinFamily } from "~/renderer/families";

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
  const module = getLLDCoinFamily<Account, Transaction, TransactionStatus>(
    props.account.currency.family,
  )?.sendAmountFields;
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default AmountRelatedField;
