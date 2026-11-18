import { useEffect, useMemo, useRef } from "react";
import type { PredictionsUiHooks } from "@features/platform-predictions";
import {
  dismissPredictionsOrderIfShown,
  reportPredictionsOrder,
  startPredictionsOrder,
} from "./predictionsOrderStore.internals";

/**
 * Per player: reports only reach the order this player started last, by its id, and unmounting
 * closes only that one.
 */
export function usePredictionsOrderHooks(): Pick<PredictionsUiHooks, "order.report"> & {
  /** Opens the sheet on "Placing your order" and returns the id the live app reports with. */
  startOrder: () => string;
} {
  const orderIdRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (orderIdRef.current !== null) dismissPredictionsOrderIfShown(orderIdRef.current);
    },
    [],
  );

  return useMemo(
    () => ({
      startOrder: () => {
        const startedId = startPredictionsOrder();
        orderIdRef.current = startedId;
        return String(startedId);
      },
      "order.report": (orderId, outcome) =>
        orderIdRef.current === null || String(orderIdRef.current) !== orderId
          ? Promise.resolve("close")
          : reportPredictionsOrder(orderIdRef.current, outcome),
    }),
    [],
  );
}
