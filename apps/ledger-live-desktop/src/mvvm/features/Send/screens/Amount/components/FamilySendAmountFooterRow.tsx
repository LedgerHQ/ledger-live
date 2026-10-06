import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useLLDCoinFamily } from "~/renderer/families";

export function FamilySendAmountFooterRow() {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const SendAmountFooterRow = useLLDCoinFamily(mainAccount?.currency.family).SendAmountFooterRow;

  if (!SendAmountFooterRow || !mainAccount || !transaction) return null;

  return <SendAmountFooterRow account={mainAccount} transaction={transaction} />;
}
