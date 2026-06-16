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
  autoFocus?: boolean;
};

export const getFields = (
  account: Account,
  isLldMemoTagEnabled?: boolean,
  sendRecipientFieldsModule?: { fields?: string[] } | null,
): string[] => {
  const module = sendRecipientFieldsModule;
  if (!isLldMemoTagEnabled) {
    return module?.fields || [];
  }
  switch (account.currency.family) {
    case "internet_computer":
      return ["transaction"];
    case "casper":
      return ["sender"];
    default:
      return module?.fields || [];
  }
};

const RecipientRelatedField = (props: Props) => {
  const specific = useLLDCoinFamily<Account, Transaction, TransactionStatus, Operation>(
    props.account.currency.family,
  );
  const module = specific?.sendRecipientFields;
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default RecipientRelatedField;
