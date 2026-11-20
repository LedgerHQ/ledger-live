import { useEffect, useMemo, useRef } from "react";
import {
  placeOrderAmountUsd,
  type PredictionsOrderDisplay,
  type PredictionsTypedData,
  type PredictionsUiHooks,
} from "@features/platform-predictions";
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
  /**
   * Opens the sheet on "Placing your order" for the signed order and the market the live app
   * describes, and returns the id the live app reports with.
   */
  startOrder: (typedData: PredictionsTypedData, display: PredictionsOrderDisplay) => string;
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
      startOrder: (typedData, display) => {
        const startedId = startPredictionsOrder({
          display,
          amountPaid: placeOrderAmountUsd(typedData),
        });
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
