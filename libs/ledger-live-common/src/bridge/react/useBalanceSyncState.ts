import { useEffect, useRef, useState } from "react";
import type { SyncPhase } from "./useSyncLifecycle";

interface UseBalanceSyncStateParams {
  readonly rawBalanceAvailable: boolean;
  readonly syncPhase: SyncPhase;
  readonly latestBalance: number;
  readonly shouldFreezeOnSync: boolean;
}

interface BalanceSyncState {
  readonly balanceAvailable: boolean;
  readonly displayedBalance: number;
  readonly isLoading: boolean;
}

/**
 * Shared balance-display logic consumed by both desktop and mobile during sync.
 *
 * - **Sticky balanceAvailable**: stays `false` while syncing so the skeleton
 *   covers the entire cycle (Skeleton → Animate balance, no shimmer gap).
 * - **Frozen balance**: holds the pre-sync value so `AmountDisplay` can
 *   animate the delta once the sync settles.
 * - **isLoading**: true while `syncPhase` is `"syncing"`.
 */
export function useBalanceSyncState({
  rawBalanceAvailable,
  syncPhase,
  latestBalance,
  shouldFreezeOnSync,
}: UseBalanceSyncStateParams): BalanceSyncState {
  const [balanceUnavailable, setBalanceUnavailable] = useState(!rawBalanceAvailable);
  useEffect(() => {
    if (!rawBalanceAvailable) {
      setBalanceUnavailable(true);
    } else if (syncPhase !== "syncing") {
      setBalanceUnavailable(false);
    }
  }, [rawBalanceAvailable, syncPhase]);

  const frozenBalanceRef = useRef(latestBalance);
  useEffect(() => {
    if (syncPhase !== "syncing") {
      frozenBalanceRef.current = latestBalance;
    }
  }, [syncPhase, latestBalance]);

  const shouldFreeze = shouldFreezeOnSync && syncPhase === "syncing";

  return {
    balanceAvailable: !balanceUnavailable,
    displayedBalance: shouldFreeze ? frozenBalanceRef.current : latestBalance,
    isLoading: syncPhase === "syncing",
  };
}
