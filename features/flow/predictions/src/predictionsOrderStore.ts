import { useEffect, useMemo, useRef } from "react";
import type { PredictionsUiHooks } from "@features/platform-predictions";
import {
  dismissPredictionsOrderIfShown,
  reportPredictionsOrder,
  startPredictionsOrder,
} from "./predictionsOrderStore.internals";

/** The order was signed after its player went away: nobody would report it, so it doesn't open. */
export class PredictionsOrderPlayerClosed extends Error {
  override name = "PredictionsOrderPlayerClosed";
}

/** Per player, so a report or an unmount only reaches the order this player started last. */
export function usePredictionsOrderHooks(): Pick<PredictionsUiHooks, "order.report"> & {
  startOrder: () => string;
  ownsOrder: (orderId: number) => boolean;
} {
  const walletOrderIdRef = useRef<number | null>(null);
  // The signature resolves before its order starts, so the player can unmount in between.
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (walletOrderIdRef.current !== null)
        dismissPredictionsOrderIfShown(walletOrderIdRef.current);
    };
  }, []);

  return useMemo(
    () => ({
      startOrder: () => {
        if (!isMountedRef.current) throw new PredictionsOrderPlayerClosed();
        const startedId = startPredictionsOrder();
        walletOrderIdRef.current = startedId;
        return String(startedId);
      },
      ownsOrder: orderId => walletOrderIdRef.current === orderId,
      "order.report": (walletOrderId, report) =>
        walletOrderIdRef.current === null || String(walletOrderIdRef.current) !== walletOrderId
          ? Promise.resolve("close")
          : reportPredictionsOrder(walletOrderIdRef.current, report),
    }),
    [],
  );
}
