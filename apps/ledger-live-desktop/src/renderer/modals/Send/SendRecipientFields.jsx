// @flow
import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

import byFamily from "~/renderer/generated/SendRecipientFields";

type Props = {
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
  onChange: Transaction => void,
};

export const getFields = (account: Account): string[] => {
  const module = byFamily[account.currency.family];
  if (!module) return [];
  return module.fields;
};

const RecipientRelatedField = (props: Props) => {
  const module = byFamily[props.account.currency.family];
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default RecipientRelatedField;
