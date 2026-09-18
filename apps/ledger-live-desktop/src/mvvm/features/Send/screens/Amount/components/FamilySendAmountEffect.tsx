import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useLLDCoinFamily } from "~/renderer/families";

/**
 * Mounts the family's `SendAmountEffect` slot while the Amount step is active
 * (e.g. Zcash starts a shielded resync as soon as the source pool is private).
 * Renders nothing by itself: the effect is entirely owned by the family
 * component and gates itself when it does not apply.
 */
export function FamilySendAmountEffect() {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const family = useLLDCoinFamily(mainAccount?.currency.family);
  const SendAmountEffect = family.SendAmountEffect;

  if (!SendAmountEffect || !mainAccount || !transaction) return null;

  return <SendAmountEffect account={mainAccount} transaction={transaction} />;
}
