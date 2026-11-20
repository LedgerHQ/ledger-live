import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";

type FamilyAmountFooterRowProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status?: TransactionStatus;
}>;

export function FamilyAmountFooterRow({
  account,
  parentAccount,
  transaction,
  status,
}: FamilyAmountFooterRowProps) {
  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const AmountFooterRow = getCustomSendFlow(mainAccount.currency.family)?.AmountFooterRow;

  if (!AmountFooterRow) return null;

  return <AmountFooterRow account={mainAccount} transaction={transaction} status={status} />;
}
