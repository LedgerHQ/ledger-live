import { useEffect, useRef } from "react";
import { mmkv } from "LLM/storage/mmkvStorageWrapper";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";

const PORTFOLIO_BALANCE_KEY = "portfolioLastKnownBalance";

/**
 * Persists the last-known portfolio balance to MMKV and provides it as a
 * fallback when the portfolio hasn't been computed yet (e.g. first frame of
 * a cold start before countervalues are loaded from cache).
 *
 * - On mount: reads the previously persisted balance synchronously.
 * - When sync completes: writes the new stable balance for the next session.
 * - Returns: the computed balance when available, otherwise the persisted one.
 *
 * This mirrors the desktop experience where the portfolio is computed from
 * fully-cached countervalues at mount, so the balance is never $0 at start.
 */
export function usePersistedPortfolioBalance(
  latestBalance: number,
  syncPhase: SyncPhase,
  currencyCode: string,
): number {
  const key = `${PORTFOLIO_BALANCE_KEY}_${currencyCode}`;
  const persistedRef = useRef<number>(mmkv.getNumber(key) ?? 0);

  // When the countervalue currency changes at runtime, reload the cached value for the new currency.
  const prevKeyRef = useRef(key);
  if (prevKeyRef.current !== key) {
    prevKeyRef.current = key;
    persistedRef.current = mmkv.getNumber(key) ?? 0;
  }

  useEffect(() => {
    if (syncPhase === "synced") {
      mmkv.set(key, latestBalance);
      persistedRef.current = latestBalance;
    }
  }, [key, syncPhase, latestBalance]);

  // Only substitute during syncing — once sync settles the real balance (even $0) is authoritative.
  return syncPhase === "syncing" ? latestBalance || persistedRef.current : latestBalance;
}
