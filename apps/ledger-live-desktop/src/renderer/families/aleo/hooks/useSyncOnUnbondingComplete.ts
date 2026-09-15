import { useEffect, useRef } from "react";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useGetLastBlockHeightQuery } from "@ledgerhq/live-common/families/aleo/state-manager/api";
import { LIVE_BLOCK_HEIGHT_POLL_MS } from "@ledgerhq/live-common/families/aleo/constants";
import { MAX_UNBONDING_SYNC_ATTEMPTS, UNBONDING_SYNC_PRIORITY } from "../constants";

/**
 * Requests account syncs while the chain has passed the unbonding height but the account has
 * not caught up yet.
 *
 * Every claimable decision — the bridge's included — reads `account.blockHeight`, which only
 * moves on a sync. So the gap is closed by syncing rather than by reading the live height in
 * more places, which would offer a claim the flow then refuses.
 *
 * The retry cadence is the chain-tip query's polling: subscribing to the same endpoint and
 * argument as `useAleoLiveBlockHeight` shares its cache entry and its single polling loop, so
 * each fresh tip is one sync attempt and there is no second timer to keep in step.
 */
export function useSyncOnUnbondingComplete(
  accountId: string,
  currencyId: string,
  enabled: boolean,
): void {
  const sync = useBridgeSync();
  const { fulfilledTimeStamp } = useGetLastBlockHeightQuery(currencyId, {
    skip: !enabled,
    pollingInterval: LIVE_BLOCK_HEIGHT_POLL_MS,
    skipPollingIfUnfocused: true,
  });
  const attemptsLeft = useRef(MAX_UNBONDING_SYNC_ATTEMPTS);

  useEffect(() => {
    if (!enabled) {
      attemptsLeft.current = MAX_UNBONDING_SYNC_ATTEMPTS;
      return;
    }
    if (attemptsLeft.current <= 0) return;
    attemptsLeft.current -= 1;

    sync({
      type: "SYNC_ONE_ACCOUNT",
      accountId,
      priority: UNBONDING_SYNC_PRIORITY,
      reason: "aleo-unbonding-complete",
    });
    // `fulfilledTimeStamp` is the tick: unused in the body, it changes once per successful
    // chain-tip poll and that is exactly when the next attempt is due.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, accountId, sync, fulfilledTimeStamp]);
}
