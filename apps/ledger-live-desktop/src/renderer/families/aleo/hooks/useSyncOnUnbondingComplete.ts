import { useEffect } from "react";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import {
  MAX_UNBONDING_SYNC_ATTEMPTS,
  UNBONDING_SYNC_PRIORITY,
  UNBONDING_SYNC_RETRY_MS,
} from "../constants";

/**
 * Requests account syncs while the chain has passed the unbonding height but the account has
 * not caught up yet.
 *
 * Every claimable decision — the bridge's included — reads `account.blockHeight`, which only
 * moves on a sync. So the gap is closed by syncing rather than by reading the live height in
 * more places, which would offer a claim the flow then refuses.
 */
export function useSyncOnUnbondingComplete(accountId: string, enabled: boolean): void {
  const sync = useBridgeSync();

  useEffect(() => {
    if (!enabled) return;

    let attemptsLeft = MAX_UNBONDING_SYNC_ATTEMPTS;
    const requestSync = () => {
      attemptsLeft -= 1;
      sync({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: UNBONDING_SYNC_PRIORITY,
        reason: "aleo-unbonding-complete",
      });
    };

    requestSync();
    const interval = setInterval(() => {
      if (attemptsLeft > 0) return requestSync();
      clearInterval(interval);
    }, UNBONDING_SYNC_RETRY_MS);

    return () => clearInterval(interval);
  }, [enabled, accountId, sync]);
}
