import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useLLDCoinFamily } from "~/renderer/families";

/**
 * Mounts the family's `SendAmountFooterRow` slot under the network fees row
 * (e.g. Aleo's estimated signing time). Renders nothing for families that
 * do not declare one.
 */
export function FamilySendAmountFooterRow() {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const family = useLLDCoinFamily(mainAccount?.currency.family);
  const SendAmountFooterRow = family.SendAmountFooterRow;

  if (!SendAmountFooterRow || !mainAccount || !transaction) return null;

  return <SendAmountFooterRow account={mainAccount} transaction={transaction} />;
}
