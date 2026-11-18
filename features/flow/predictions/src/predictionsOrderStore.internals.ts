import type {
  PredictionsOrderAction,
  PredictionsOrderOutcome,
} from "@features/platform-predictions";
import { createPendingResultStore, type ShownResult } from "./pendingResultStore.internals";

/** What the order dialog shows. `key` changes with every order and outcome. */
export type ShownOrder = ShownResult<PredictionsOrderOutcome>;

/**
 * Longer than the live app waits for MoonPay to confirm an order, so a live app that never reports
 * doesn't leave the order placing forever.
 */
export const ORDER_REPORT_TIMEOUT_MS = 3 * 60 * 1000;

const orderStore = createPendingResultStore<PredictionsOrderOutcome, PredictionsOrderAction>({
  dismissedAnswer: "close",
  timeout: { ms: ORDER_REPORT_TIMEOUT_MS, outcome: { outcome: "unconfirmed" } },
});

export const startPredictionsOrder = orderStore.start;
export const reportPredictionsOrder = orderStore.report;
export const markPredictionsOrderPresented = orderStore.markPresented;
export const dismissPredictionsOrderIfShown = orderStore.dismissIfShown;

export function closePredictionsOrder() {
  orderStore.close("close");
}

/** Closes the order so the live app signs a new one on a fresh quote. */
export function retryPredictionsOrder() {
  orderStore.close("retry");
}

export function usePredictionsOrder(): Readonly<{
  isOpen: boolean;
  shownOrder: ShownOrder | null;
}> {
  const { isOpen, shownResult } = orderStore.useShownResult();
  return { isOpen, shownOrder: shownResult };
}
