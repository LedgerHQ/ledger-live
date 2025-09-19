import { log } from "@ledgerhq/logs";
import { Account } from "@ledgerhq/types-live";
import { Props } from "../react/BridgeSync";

type Session = {
  reason: string;
  startTime: number;
  accountIds: string[];
  remaining: Set<string>;
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
    };
    logSyncSession("started", { reason, accounts: ids.length });
  };

  const onAccountSyncDone = (accountId: string, accounts: Account[]) => {
    if (!current) return;

    current.remaining.delete(accountId);

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
  });

  logSyncSession("finished", { reason: session.reason, duration: `${duration}s` });
}

function logSyncSession(event: "started" | "finished", data: Record<string, string | number>) {
  const serialized = Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  log("bridge", `SyncSession ${event} ${serialized}`);
}
