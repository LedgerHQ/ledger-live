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
 * The live block-height poll sees the crossing within seconds; `account.blockHeight` only
 * moves on a sync, and that is the height every claimable decision reads. So the gap is
 * closed by syncing rather than by reading the live height in more places — the bridge
 * validates the claim against the synced height too, and a UI that disagreed with it would
 * offer a claim the flow then refuses.
 *
 * Retries because a single sync can fail or land a block too early; the effect tears down as
 * soon as `enabled` goes false, which is what a successful sync causes.
 */
export function useSyncOnUnbondingComplete(accountId: string, enabled: boolean): void {
  const sync = useBridgeSync();

  useEffect(() => {
    if (!enabled) return;

    let attempts = 0;
    const requestSync = () => {
      attempts += 1;
      sync({
        type: "SYNC_ONE_ACCOUNT",
        accountId,
        priority: UNBONDING_SYNC_PRIORITY,
        reason: "aleo-unbonding-complete",
      });
    };

    requestSync();
    const interval = setInterval(() => {
      // Give up rather than poll forever: the background tick remains the backstop, and the
      // row keeps showing that it is still settling.
      if (attempts >= MAX_UNBONDING_SYNC_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      requestSync();
    }, UNBONDING_SYNC_RETRY_MS);

    return () => clearInterval(interval);
  }, [enabled, accountId, sync]);
}
