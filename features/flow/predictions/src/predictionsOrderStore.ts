import { useEffect, useMemo, useRef } from "react";
import {
  isSellPosition,
  orderReportFor,
  placeOrderAmountUsd,
  sellPositionShares,
  type PredictionsOrderDisplay,
  type PredictionsTypedData,
  type PredictionsUiHooks,
} from "@features/platform-predictions";
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
  startOrder: (typedData: PredictionsTypedData, display: PredictionsOrderDisplay) => string;
  ownsOrder: (orderId: number) => boolean;
} {
  const startedOrderRef = useRef<{ id: number; typedData: PredictionsTypedData } | null>(null);
  // The signature resolves before its order starts, so the player can unmount in between.
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (startedOrderRef.current !== null)
        dismissPredictionsOrderIfShown(startedOrderRef.current.id);
    };
  }, []);

  return useMemo(
    () => ({
      startOrder: (typedData, display) => {
        if (!isMountedRef.current) throw new PredictionsOrderPlayerClosed();
        const startedId = startPredictionsOrder(
          isSellPosition(typedData)
            ? { side: "sale", display, shares: sellPositionShares(typedData) }
            : { side: "buy", display, amountPaid: placeOrderAmountUsd(typedData) },
        );
        startedOrderRef.current = { id: startedId, typedData };
        return String(startedId);
      },
      ownsOrder: orderId => startedOrderRef.current?.id === orderId,
      "order.report": async (walletOrderId, report) => {
        const startedOrder = startedOrderRef.current;
        if (startedOrder === null || String(startedOrder.id) !== walletOrderId) return "close";
        return reportPredictionsOrder(
          startedOrder.id,
          orderReportFor(startedOrder.typedData, report),
        );
      },
    }),
    [],
  );
}
