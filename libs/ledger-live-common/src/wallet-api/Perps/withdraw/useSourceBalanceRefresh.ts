import { useEffect, useReducer } from "react";
import { useBridgeSync } from "../../../bridge/react/context";
import { useAccountSyncState } from "../../../bridge/react/useAccountSyncState";

/** Past this, the form shows the balance it has rather than loading forever. */
export const SOURCE_BALANCE_REFRESH_TIMEOUT_MS = 10_000;

type RefreshPhase = "waitingForSync" | "syncing" | "done";
type RefreshEvent = "syncStarted" | "syncDone" | "timeout";

function reducer(phase: RefreshPhase, event: RefreshEvent): RefreshPhase {
  if (phase === "done") return phase;
  switch (event) {
    case "syncStarted":
      return "syncing";
    case "syncDone":
      return phase === "syncing" ? "done" : phase;
    case "timeout":
      return "done";
  }
}

/**
 * Syncs the HyperCore account when the withdraw form opens. Its available balance moves with every
 * withdraw and every margin change in perps-live-app, and the stored one can be minutes old.
 * Returns true until that sync is done.
 */
export function useSourceBalanceRefresh(accountId: string): boolean {
  const sync = useBridgeSync();
  const { pending } = useAccountSyncState({ accountId });
  const [phase, dispatch] = useReducer(reducer, "waitingForSync");

  useEffect(() => {
    sync({ type: "SYNC_ONE_ACCOUNT", accountId, priority: 10, reason: "perps-withdraw-form" });
    const timer = setTimeout(() => dispatch("timeout"), SOURCE_BALANCE_REFRESH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [accountId, sync]);

  useEffect(() => {
    dispatch(pending ? "syncStarted" : "syncDone");
  }, [pending]);

  return phase !== "done";
}
