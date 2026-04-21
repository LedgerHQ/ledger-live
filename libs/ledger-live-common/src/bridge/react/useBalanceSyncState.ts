import { useEffect, useRef, useState } from "react";
import type { SyncPhase } from "./useSyncLifecycle";

interface UseBalanceSyncStateParams {
  readonly rawBalanceAvailable: boolean;
  readonly syncPhase: SyncPhase;
  readonly latestBalance: number;
  readonly shouldFreezeOnSync: boolean;
  /**
   * When provided, scopes the sticky-clear and freeze logic to the CVS phase
   * instead of the full sync cycle. Use `syncPhase === "syncing" && cvPending`
   * so that auto-polls never trigger the shimmer.
   * When omitted, falls back to `syncPhase === "syncing"` (desktop behaviour).
   */
  readonly cvPending?: boolean;
}

interface BalanceSyncState {
  readonly balanceAvailable: boolean;
  readonly displayedBalance: number;
  readonly isLoading: boolean;
}

/**
 * Shared balance-display logic consumed by both desktop and mobile during sync.
 *
 * - **Sticky balanceAvailable**: stays `false` while the active phase holds so
 *   the skeleton covers the cycle (Skeleton → Animate balance, no shimmer gap).
 * - **Frozen balance**: holds the pre-sync value so `AmountDisplay` can
 *   animate the delta once the phase settles.
 * - **isLoading**: true while `syncPhase` is `"syncing"`.
 */
export function useBalanceSyncState({
  rawBalanceAvailable,
  syncPhase,
  latestBalance,
  shouldFreezeOnSync,
  cvPending,
}: UseBalanceSyncStateParams): BalanceSyncState {
  // When cvPending is provided (mobile), the "active phase" ends when CVS settles
  // rather than when the full bridge sync settles. This lets the balance animate
  // to the new CVS value and continue updating per account batch.
  const isPhaseActive = cvPending ?? syncPhase === "syncing";

  const [balanceUnavailable, setBalanceUnavailable] = useState(!rawBalanceAvailable);
  useEffect(() => {
    if (!rawBalanceAvailable) {
      setBalanceUnavailable(true);
    } else if (!isPhaseActive) {
      setBalanceUnavailable(false);
    }
  }, [rawBalanceAvailable, isPhaseActive]);

  const frozenBalanceRef = useRef(latestBalance);
  useEffect(() => {
    if (!isPhaseActive) {
      frozenBalanceRef.current = latestBalance;
    }
  }, [isPhaseActive, latestBalance]);

  const shouldFreeze = shouldFreezeOnSync && isPhaseActive;

  return {
    balanceAvailable: !balanceUnavailable,
    displayedBalance: shouldFreeze ? frozenBalanceRef.current : latestBalance,
    isLoading: isPhaseActive,
  };
}
