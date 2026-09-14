import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useLLDCoinFamily } from "~/renderer/families";

export function FamilySendRecipientNotice() {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const family = useLLDCoinFamily(mainAccount?.currency.family);
  const Notice = family.SendRecipientNotice;

  if (!Notice || !mainAccount || !transaction) return null;

  return <Notice account={mainAccount} transaction={transaction} />;
}
