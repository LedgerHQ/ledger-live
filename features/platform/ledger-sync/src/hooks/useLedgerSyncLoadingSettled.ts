import { useEffect, useState } from "react";
import { useWalletSyncUserState } from "./useWalletSyncUserState";

/**
 * True once the loading step waited for the first watch loop cycle (`initialTimeout`, 1 second
 * by default, plus 1.5 seconds) and no cycle is visibly pending. The app then leaves the step.
 *
 * @example
 * ```ts
 * const isSettled = useLedgerSyncLoadingSettled(featureWalletSync?.params?.watchConfig?.initialTimeout);
 * useEffect(() => {
 *   if (isSettled) navigation.navigate(ScreenName.WalletSyncSuccess, { created });
 * }, [isSettled, navigation, created]);
 * ```
 */
export function useLedgerSyncLoadingSettled(initialTimeout: number | undefined): boolean {
  const [waitedWatchLoop, setWaitedWatchLoop] = useState(false);
  const { visualPending } = useWalletSyncUserState();
  const watchLoopTimeout = initialTimeout || DEFAULT_INITIAL_TIMEOUT;

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setWaitedWatchLoop(true);
      },
      watchLoopTimeout + VISUAL_PENDING_TIMEOUT + 500,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [watchLoopTimeout]);

  return waitedWatchLoop && !visualPending;
}

const DEFAULT_INITIAL_TIMEOUT = 1000;
const VISUAL_PENDING_TIMEOUT = 1000;
