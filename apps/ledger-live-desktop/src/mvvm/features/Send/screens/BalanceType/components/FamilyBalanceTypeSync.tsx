import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useLLDCoinFamily } from "~/renderer/families";

type FamilyBalanceTypeSyncProps = Readonly<{
  onComplete: () => void;
  onCancel: () => void;
}>;

export function FamilyBalanceTypeSync({ onComplete, onCancel }: FamilyBalanceTypeSyncProps) {
  const { state } = useSendFlowData();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const SendBalanceTypeSync = useLLDCoinFamily(mainAccount?.currency.family).SendBalanceTypeSync;

  if (!SendBalanceTypeSync || !mainAccount || !transaction) return null;

  return (
    <SendBalanceTypeSync
      account={mainAccount}
      transaction={transaction}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}
