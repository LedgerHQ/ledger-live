import React, { useEffect } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useRecipientContinuation } from "../../../context/RecipientContinuationContext";
import { useLLDCoinFamily } from "~/renderer/families";

export function FamilySendRecipientNotice() {
  const { state } = useSendFlowData();
  const { setFamilyRecipientBlocked } = useRecipientContinuation();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const family = useLLDCoinFamily(mainAccount?.currency.family);
  const Notice = family.SendRecipientNotice;

  // Clear any block this notice raised when it leaves the recipient step, so a
  // family-imposed block can never leak into later steps or the next flow.
  useEffect(() => () => setFamilyRecipientBlocked(false), [setFamilyRecipientBlocked]);

  if (!Notice || !mainAccount || !transaction) return null;

  return (
    <Notice
      account={mainAccount}
      transaction={transaction}
      onBlockedChange={setFamilyRecipientBlocked}
    />
  );
}
