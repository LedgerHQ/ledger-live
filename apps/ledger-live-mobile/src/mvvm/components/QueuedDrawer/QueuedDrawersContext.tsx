import React from "react";

/**
 * A function to call when the drawer should be opened or closed.
 * @param opened Whether the drawer should be opened or closed.
 */
export type OnDrawerStateChangedCallback = (opened: boolean) => void;

/**
 * An object that represents a drawer in the queue.
 * It has methods to remove the drawer from the queue and get its position in the queue.
 */
export type DrawerInQueue = {
  removeDrawerFromQueue: () => void;
  getPositionInQueue: () => number;
};

type QueuedDrawersContextType = {
  /**
   * Add a drawer to the queue.
   * @param onDrawerStateChanged The callback to call when the drawer should be opened or closed.
   * @param force If true, the drawer will be opened immediately and all other drawers in the queue will be closed and removed from the queue.
   * @returns An object with methods to remove the drawer from the queue and get its position in the queue.
   */
  addDrawerToQueue: (
    onDrawerStateChanged: OnDrawerStateChangedCallback,
    force: boolean,
  ) => DrawerInQueue;

  /**
   * Close all drawers in the queue.
   */
  closeAllDrawers: () => void;

  /**
   * Clear the drawer queue.
   * This should not be used except for debugging purposes.
   */
  _clearQueueDIRTYDONOTUSE(): void;
};

export const QueuedDrawersContext = React.createContext<QueuedDrawersContextType | undefined>(
  undefined,
);

export function useQueuedDrawerContext() {
  const contextValue = React.useContext(QueuedDrawersContext);
  if (contextValue === undefined)
    throw new Error("useQueuedDrawerContext must be used within a QueuedDrawersContextProvider");
  return contextValue;
}
