import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPoxInfo } from "@ledgerhq/live-common/families/stacks/react";

// A small fraction of a pox-5 reward cycle (~14 days on mainnet).
export const START_BURN_HT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
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
