import type { SendAccount, SendAccountLike } from "../registry";
import { useEffect } from "react";
import { useSendFlowPorts } from "../ports/SendFlowPortsContext";

const SEND_FLOW_SYNC_PRIORITY = 100;

type UseSyncSendFlowAccountParams = Readonly<{
  account: SendAccountLike | null;
  parentAccount: SendAccount | null;
  accounts: readonly SendAccount[];
  onAccountRefreshed: (account: SendAccountLike, parentAccount: SendAccount | null) => void;
}>;

function getMainAccountId(
  account: SendAccountLike,
  parentAccount: SendAccount | null,
): string | undefined {
  return account.type === "Account" ? account.id : parentAccount?.id;
}

export function findRefreshedAccount(
  accounts: readonly SendAccount[],
  account: SendAccountLike,
  parentAccount: SendAccount | null,
): { account: SendAccountLike; parentAccount: SendAccount | null } | null {
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
  const sync = useSendFlowPorts().useAccountSync();
  const mainAccountId = account ? getMainAccountId(account, parentAccount) : undefined;

  useEffect(() => {
    if (!mainAccountId) return;
    sync({
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
