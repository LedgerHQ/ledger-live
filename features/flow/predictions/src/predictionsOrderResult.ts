import { useState } from "react";
import type {
  PredictionsOrderAction,
  PredictionsOrderReport,
} from "@features/platform-predictions";
import {
  closePredictionsOrderIfShown,
  useIsPredictionsOrderSheetOnScreen,
  usePredictionsOrder,
  type PredictionsOrderDetails,
} from "./predictionsOrderStore.internals";

export type PredictionsOrderResult = Readonly<{
  order: PredictionsOrderDetails;
  report: PredictionsOrderReport;
}>;

/** The order whose result waits for its page: reported, with its placing sheet gone. */
export function usePredictionsOrderAwaitingResultPage(): number | null {
  const { isOpen, shownOrder } = usePredictionsOrder();
  const isSheetOnScreen = useIsPredictionsOrderSheetOnScreen();
  if (!isOpen || shownOrder === null || shownOrder.result === null || isSheetOnScreen) return null;
  return shownOrder.id;
}

/** The order's result, kept once answered so its page doesn't go blank while it leaves. */
export function usePredictionsOrderResult(orderId: number): PredictionsOrderResult | null {
  const { shownOrder } = usePredictionsOrder();
  const current =
    shownOrder?.id === orderId && shownOrder.result !== null
      ? { key: shownOrder.key, order: shownOrder.context, report: shownOrder.result }
      : null;
  const [last, setLast] = useState(current);

  if (current !== null && current.key !== last?.key) setLast(current);

  const shown = current ?? last;
  return shown && { order: shown.order, report: shown.report };
}

export function answerPredictionsOrder(orderId: number, answer: PredictionsOrderAction) {
  closePredictionsOrderIfShown(orderId, answer);
}

export function predictionsOrderResultTone(
  report: PredictionsOrderReport,
): "success" | "error" | "info" {
  switch (report.status) {
    case "filled":
      return "success";
    case "unconfirmed":
      return "info";
    case "not-filled":
    case "rejected":
      return "error";
  }
}
