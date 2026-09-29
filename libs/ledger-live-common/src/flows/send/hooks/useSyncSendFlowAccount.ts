import { useEffect } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useBridgeSync } from "../../../bridge/react/context";

const SEND_FLOW_SYNC_PRIORITY = 100;

type UseSyncSendFlowAccountParams = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
  accounts: readonly Account[];
  onAccountRefreshed: (account: AccountLike, parentAccount: Account | null) => void;
}>;

function getMainAccountId(account: AccountLike, parentAccount: Account | null): string | undefined {
  return account.type === "Account" ? account.id : parentAccount?.id;
}

export function findRefreshedAccount(
  accounts: readonly Account[],
  account: AccountLike,
  parentAccount: Account | null,
): { account: AccountLike; parentAccount: Account | null } | null {
  const mainAccountId = getMainAccountId(account, parentAccount);
  const mainAccount = accounts.find(a => a.id === mainAccountId);
  if (!mainAccount) return null;

  if (account.type === "Account") {
    return { account: mainAccount, parentAccount: null };
  }

  const subAccount = mainAccount.subAccounts?.find(a => a.id === account.id);
  return subAccount ? { account: subAccount, parentAccount: mainAccount } : null;
}

/**
 * Syncs the Send flow account when it is opened or changed, and keeps the flow
 * on the store's up-to-date version of that account.
 */
export function useSyncSendFlowAccount({
  account,
  parentAccount,
  accounts,
  onAccountRefreshed,
}: UseSyncSendFlowAccountParams): void {
  const sync = useBridgeSync();
  const mainAccountId = account ? getMainAccountId(account, parentAccount) : undefined;

  useEffect(() => {
    if (!mainAccountId) return;
    sync({
      type: "SYNC_ONE_ACCOUNT",
      accountId: mainAccountId,
      priority: SEND_FLOW_SYNC_PRIORITY,
      reason: "transaction-flow-init",
    });
  }, [sync, mainAccountId]);

  useEffect(() => {
    if (!account) return;
    const refreshed = findRefreshedAccount(accounts, account, parentAccount);
    if (!refreshed) return;
    if (refreshed.account === account && refreshed.parentAccount === parentAccount) return;
    onAccountRefreshed(refreshed.account, refreshed.parentAccount);
  }, [accounts, account, parentAccount, onAccountRefreshed]);
}
