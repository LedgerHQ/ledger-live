import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useLLDCoinFamily } from "~/renderer/families";

/**
 * Mounts the family's `PostBroadcastEffect` slot once a send has completed, so a
 * family can react to the broadcast (e.g. Zcash triggers a shielded resync after
 * a private transfer). Renders nothing by itself: the effect is entirely owned by
 * the family component and only runs once an optimistic operation exists.
 */
export function FamilyPostBroadcastEffect() {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const operation = state.operation.optimisticOperation;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const family = useLLDCoinFamily(mainAccount?.currency.family);
  const PostBroadcastEffect = family.PostBroadcastEffect;

  if (!PostBroadcastEffect || !mainAccount || !transaction || !operation) return null;

  return (
    <PostBroadcastEffect account={mainAccount} transaction={transaction} operation={operation} />
  );
}
