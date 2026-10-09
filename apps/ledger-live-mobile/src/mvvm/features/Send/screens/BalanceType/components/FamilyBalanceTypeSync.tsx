import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { sendBalanceTypeSyncByFamily } from "../../../utils/familySendSlots";

type FamilyBalanceTypeSyncProps = Readonly<{
  onComplete: () => void;
}>;

export function FamilyBalanceTypeSync({ onComplete }: FamilyBalanceTypeSyncProps) {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike
    ? getMainAccount(accountLike, state.account.parentAccount)
    : undefined;
  const family = mainAccount?.currency.family;
  const SendBalanceTypeSync =
    family && Object.hasOwn(sendBalanceTypeSyncByFamily, family)
      ? sendBalanceTypeSyncByFamily[family]
      : undefined;

  if (!SendBalanceTypeSync || !mainAccount || !transaction) return null;

  return (
    <SendBalanceTypeSync account={mainAccount} transaction={transaction} onComplete={onComplete} />
  );
}
