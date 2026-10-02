import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPoxInfo } from "@ledgerhq/live-common/families/stacks/react";

// A small fraction of a pox-5 reward cycle (~14 days on mainnet).
export const START_BURN_HT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Why the height is the chain tip with no forward buffer: pox-5's `stake` evaluates both checks
 * below against the cycle current when it is mined (`current-pox-reward-cycle`, `pox-5.clar:985`).
 * - `start-burn-ht` must fall in that cycle, else `ERR_INVALID_START_BURN_HEIGHT`
 *   (`pox-5.clar:987,1016-1020`). A buffered height in the next cycle would fail this check
 *   immediately.
 * - The prepare phase is rejected first, with `ERR_STAKE_IN_PREPARE_PHASE` (`verify-not-prepare-phase`,
 *   `pox-5.clar:1002,2956-2960`).
 * A stake signed just before the prepare phase and mined after it opens, or after the cycle has
 * rolled over (the chain passes through the prepare phase to get there), aborts on one of these.
 * The fee is charged, and no STX is locked. No buffer avoids that. Shrinking the window is the job
 * of `validateIntent`'s prepare-phase check, plus this refresh up to signing.
 *
 * pox-5 rejects a `start-burn-ht` from a past reward cycle, so the height tracks the live chain tip
 * for as long as the transaction can still change: on the Amount and SelectDevice screens. It stops
 * on ConnectDevice, which signs the snapshot it receives, so a refresh can never interrupt a
 * signing. This mirrors LLD's StakeFlowModal, which keeps refreshing until a device is present.
 */
export function useStartBurnHtRefresh(
  enabled: boolean,
  onResolved: (startBurnHt: number) => void,
): { poxError: Error | null; retry: () => void } {
  const [poxError, setPoxError] = useState<Error | null>(null);
  const request = useRef(0);
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  const resolve = useCallback(() => {
    const current = ++request.current;
    fetchPoxInfo()
      .then(poxInfo => {
        if (current !== request.current) return;
        setPoxError(null);
        onResolvedRef.current(poxInfo.current_burnchain_block_height);
      })
      .catch((error: Error) => {
        if (current !== request.current) return;
        setPoxError(error);
      });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    resolve();
    const intervalId = setInterval(resolve, START_BURN_HT_REFRESH_INTERVAL_MS);
    return () => {
      request.current += 1;
      clearInterval(intervalId);
    };
  }, [enabled, resolve]);

  return { poxError, retry: resolve };
}
