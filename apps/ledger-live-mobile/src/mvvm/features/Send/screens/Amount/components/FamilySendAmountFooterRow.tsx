import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { sendAmountFooterRowByFamily } from "../../../utils/familySendSlots";

export function FamilySendAmountFooterRow() {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike
    ? getMainAccount(accountLike, state.account.parentAccount)
    : undefined;
  const family = mainAccount?.currency.family;
  const SendAmountFooterRow =
    family && Object.hasOwn(sendAmountFooterRowByFamily, family)
      ? sendAmountFooterRowByFamily[family]
      : undefined;

  if (!SendAmountFooterRow || !mainAccount || !transaction) return null;

  return <SendAmountFooterRow account={mainAccount} transaction={transaction} />;
}
