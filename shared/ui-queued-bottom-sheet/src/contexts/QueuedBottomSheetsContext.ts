import React from "react";

/**
 * Handlers invoked by the queue when this sheet should open or close.
 */
export type BottomSheetStateHandlers = {
  open: () => void;
  close: () => void;
};

/**
 * Handle for a bottom sheet currently registered in the queue.
 */
export type BottomSheetInQueue = {
  removeBottomSheetFromQueue: () => void;
  getPositionInQueue: () => number;
};

type QueuedBottomSheetsContextType = {
  /**
   * Add a bottom sheet to the queue.
   * @param stateHandlers Called when the sheet should open or close.
   * @param force If true, open immediately and close/remove every other sheet in the queue.
   */
  addBottomSheetToQueue: (
    stateHandlers: BottomSheetStateHandlers,
    force: boolean,
  ) => BottomSheetInQueue;

  /** Close every bottom sheet in the queue. */
  closeAllBottomSheets: () => void;

  /**
   * Clear the queue without closing sheets.
   * Debugging only — do not use in product code.
   */
  _clearQueueDIRTYDONOTUSE(): void;
};

export const QueuedBottomSheetsContext = React.createContext<
  QueuedBottomSheetsContextType | undefined
>(undefined);

export function useQueuedBottomSheetContext() {
  const contextValue = React.useContext(QueuedBottomSheetsContext);
  if (contextValue === undefined)
    throw new Error("useQueuedBottomSheetContext must be used within a QueuedBottomSheetsProvider");
  return contextValue;
}
