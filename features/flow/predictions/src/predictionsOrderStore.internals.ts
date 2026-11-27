import { useSyncExternalStore } from "react";
import type {
  PredictionsOrderAction,
  PredictionsOrderDisplay,
  PredictionsOrderReport,
} from "@features/platform-predictions";
import { createPendingResultStore, type ShownResult } from "./pendingResultStore.internals";

export type PredictionsOrderDetails = Readonly<
  | {
      side: "buy";
      display: PredictionsOrderDisplay;
      /** In USD, from the signed order. */
      amountPaid: number;
    }
  | {
      side: "sale";
      display: PredictionsOrderDisplay;
      /** From the signed sale, which fills completely or not at all. */
      shares: number;
    }
>;

export type ShownOrder = ShownResult<PredictionsOrderReport, PredictionsOrderDetails>;

// Longer than the live app waits for MoonPay, so an order it never reports doesn't place forever.
export const ORDER_REPORT_TIMEOUT_MS = 3 * 60 * 1000;

const orderStore = createPendingResultStore<
  PredictionsOrderReport,
  PredictionsOrderAction,
  PredictionsOrderDetails
>({
  dismissedAnswer: "close",
  timeout: { ms: ORDER_REPORT_TIMEOUT_MS, result: { status: "unconfirmed" } },
});

// On native the result opens on its own page, once the placing sheet has left the screen.
let isSheetOnScreen = false;
const sheetListeners = new Set<() => void>();

function setIsSheetOnScreen(isOnScreen: boolean) {
  if (isSheetOnScreen === isOnScreen) return;
  isSheetOnScreen = isOnScreen;
  sheetListeners.forEach(listener => listener());
}

function subscribeToSheet(listener: () => void) {
  sheetListeners.add(listener);
  return () => {
    sheetListeners.delete(listener);
  };
}

const getIsSheetOnScreen = () => isSheetOnScreen;

export const startPredictionsOrder = orderStore.start;
export const reportPredictionsOrder = orderStore.report;
export const dismissPredictionsOrderIfShown = orderStore.dismissIfShown;
export const closePredictionsOrderIfShown = orderStore.closeIfShown;

export function markPredictionsOrderPresented() {
  setIsSheetOnScreen(true);
  orderStore.markPresented();
}

export function markPredictionsOrderSheetHidden() {
  setIsSheetOnScreen(false);
}

export function closePredictionsOrder() {
  orderStore.close("close");
}

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

export function useIsPredictionsOrderSheetOnScreen(): boolean {
  return useSyncExternalStore(subscribeToSheet, getIsSheetOnScreen, getIsSheetOnScreen);
}
