import React from "react";
import { Account, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getLLDCoinFamily } from "~/renderer/families";

type Props = {
  account: Account;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
};

export const getFields = (account: Account): string[] => {
  const module = getLLDCoinFamily(account.currency.family)?.sendRecipientFields;
  return module?.fields || [];
};

const RecipientRelatedField = (props: Props) => {
  const module = getLLDCoinFamily<Account, Transaction, TransactionStatus, Operation>(
    props.account.currency.family,
  )?.sendRecipientFields;
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default RecipientRelatedField;
