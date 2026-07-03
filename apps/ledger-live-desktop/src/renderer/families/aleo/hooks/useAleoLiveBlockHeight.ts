import { useCallback, useEffect, useRef, useState } from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { lastBlock } from "@ledgerhq/live-common/families/aleo/logic";
import useInterval from "~/renderer/hooks/useInterval";
import { LIVE_BLOCK_HEIGHT_POLL_MS } from "../constants";

type Options = {
  /** Height to fall back to (typically account.blockHeight) until a live value is fetched. */
  fallbackHeight: number;
  /** Poll only while true, e.g. an unstaking countdown is actually on screen. */
  enabled: boolean;
};

/**
 * Returns the freshest known Aleo block height, polling `lastBlock` every
 * {@link LIVE_BLOCK_HEIGHT_POLL_MS} while `enabled`. Polling pauses when the tab
 * is hidden and network errors are swallowed (last good value is kept).
 */
export function useAleoLiveBlockHeight(
  currency: CryptoCurrency,
  { fallbackHeight, enabled }: Options,
): number {
  const [liveHeight, setLiveHeight] = useState<number | null>(null);
  // Skip overlapping fetches, and ignore a fetch that resolves after the
  // current enabled-session ended (so a late reply can't overwrite the reset).
  const inFlight = useRef(false);
  const cancelled = useRef(false);

  const fetchHeight = useCallback(async () => {
    if (inFlight.current || document.hidden) return;
    inFlight.current = true;
    try {
      const block = await lastBlock(currency);
      if (!cancelled.current) setLiveHeight(block.height);
    } catch {
      // Keep the last good value; the next tick will retry.
    } finally {
      inFlight.current = false;
    }
    // currency.id keeps the callback stable across referentially-new currency objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency.id]);

  // Poll on a fixed cadence while enabled; `null` pauses the shared interval.
  useInterval(fetchHeight, enabled ? LIVE_BLOCK_HEIGHT_POLL_MS : null);

  useEffect(() => {
    if (!enabled) {
      // Drop any stale height from a previous countdown so the next one starts
      // clean instead of inheriting an inflated value. The prior enabled run's
      // cleanup already set `cancelled`, so an in-flight fetch can't undo this.
      setLiveHeight(null);
      return;
    }
    cancelled.current = false;
    // Fetch straight away, and again whenever the tab becomes visible, so the
    // value is fresh without waiting a full interval.
    fetchHeight();
    const onVisibilityChange = () => {
      if (!document.hidden) fetchHeight();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled.current = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, fetchHeight]);

  return liveHeight != null ? Math.max(liveHeight, fallbackHeight) : fallbackHeight;
}
