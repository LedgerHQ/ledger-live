import { log } from "@ledgerhq/logs";
import { Account } from "@ledgerhq/types-live";
import { Props } from "../react/BridgeSync";

type Session = {
  reason: string;
  startTime: number;
  accountIds: string[];
  remaining: Set<string>;
  errorsCount: number;
};

// Session manager factory to track global sync sessions (Accounts)
export function createSyncSessionManager(trackAnalytics: Props["trackAnalytics"]) {
  let current: Session | null = null;

  let hasTrackedInitial = false;

  const start = (ids: string[], reason: string) => {
    if (reason === "initial" && hasTrackedInitial) return;
    current = {
      reason,
      startTime: Date.now(),
      accountIds: ids,
      remaining: new Set(ids),
      errorsCount: 0,
    };
    logSyncSession("started", { reason, accounts: ids.length });
  };

  /**
   *
   * @param accountId - the account id that has completed sync
   * @param accounts - the accounts that will be synced
   * @param hadError - whether the account sync had an error
   *
   */
  const onAccountSyncDone = (accountId: string, accounts: Account[], hadError = false) => {
    if (!current) return;

    current.remaining.delete(accountId);
    if (hadError) {
      current.errorsCount += 1;
    }

    if (current.remaining.size === 0) {
      trackSessionAnalytics(trackAnalytics, current, accounts);

      if (current.reason === "initial") {
        hasTrackedInitial = true;
      }
      current = null;
    }
  };

  return { start, onAccountSyncDone } as const;
}

export function getTotalOperations(accounts: Account[]): number {
  return accounts.reduce((sum, acc) => sum + acc.operationsCount, 0);
}

export function getUniqueChains(accounts: Account[]): string[] {
  return [...new Set(accounts.map(acc => acc.currency.name))];
}

export function trackSessionAnalytics(
  trackAnalytics: Props["trackAnalytics"],
  session: Session,
  accounts: Account[],
) {
  const duration = (Date.now() - session.startTime) / 1000;
  const totalOps = getTotalOperations(accounts);
  const chains = getUniqueChains(accounts);

  trackAnalytics("SyncSuccessAllAccounts", {
    duration,
    accountsCount: accounts.length,
    operationsCount: totalOps,
    chains,
    reason: session.reason,
    syncWithErrors: session.errorsCount,
  });

  logSyncSession("finished", { reason: session.reason, duration: `${duration}s` });
}

function logSyncSession(event: "started" | "finished", data: Record<string, string | number>) {
  const serialized = Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  log("bridge", `SyncSession ${event} ${serialized}`);
}
