import { useEffect, useState } from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { lastBlock } from "@ledgerhq/live-common/families/aleo/logic";
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

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;

    const fetchHeight = async () => {
      if (inFlight || document.hidden) return;
      inFlight = true;
      try {
        const block = await lastBlock(currency);
        if (!cancelled) setLiveHeight(block.height);
      } catch {
        // Keep the last good value; the next tick will retry.
      } finally {
        inFlight = false;
      }
    };

    fetchHeight();
    const intervalId = window.setInterval(fetchHeight, LIVE_BLOCK_HEIGHT_POLL_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) fetchHeight();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // currency.id keeps the effect stable across referentially-new currency objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency.id, enabled]);

  return liveHeight != null ? Math.max(liveHeight, fallbackHeight) : fallbackHeight;
}
