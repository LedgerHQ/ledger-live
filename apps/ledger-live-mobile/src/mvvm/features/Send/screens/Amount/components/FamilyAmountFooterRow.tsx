import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";

type FamilyAmountFooterRowProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
}>;

export function FamilyAmountFooterRow({
  account,
  parentAccount,
  transaction,
}: FamilyAmountFooterRowProps) {
  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const AmountFooterRow = getCustomSendFlow(mainAccount.currency.family)?.AmountFooterRow;

  if (!AmountFooterRow) return null;

  return <AmountFooterRow account={mainAccount} transaction={transaction} />;
}
