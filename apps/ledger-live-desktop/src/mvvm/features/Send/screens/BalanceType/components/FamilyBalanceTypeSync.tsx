import React, { useCallback } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useLLDCoinFamily } from "~/renderer/families";

type FamilyBalanceTypeSyncProps = Readonly<{
  onComplete: () => void;
  onCancel: () => void;
}>;

/**
 * Mounts the family's `SendBalanceTypeSync` slot once a balance pool is picked
 * (e.g. Aleo refreshes its private records before a private send). The family
 * decides whether anything has to happen and calls `onComplete` to move on.
 */
export function FamilyBalanceTypeSync({ onComplete, onCancel }: FamilyBalanceTypeSyncProps) {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const accountLike = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const mainAccount = accountLike ? getMainAccount(accountLike, parentAccount) : undefined;
  const SendBalanceTypeSync = useLLDCoinFamily(mainAccount?.currency.family).SendBalanceTypeSync;

  const onAccountUpdated = useCallback(
    (updatedMainAccount: Account) => {
      if (accountLike?.type !== "TokenAccount") {
        transactionActions.updateAccount(updatedMainAccount);
        return;
      }
      const updatedTokenAccount = updatedMainAccount.subAccounts?.find(
        subAccount => subAccount.id === accountLike.id,
      );
      transactionActions.updateAccount(updatedTokenAccount ?? accountLike, updatedMainAccount);
    },
    [accountLike, transactionActions],
  );

  if (!SendBalanceTypeSync || !mainAccount || !transaction) return null;

  return (
    <SendBalanceTypeSync
      account={mainAccount}
      transaction={transaction}
      onComplete={onComplete}
      onCancel={onCancel}
      onAccountUpdated={onAccountUpdated}
    />
  );
}
