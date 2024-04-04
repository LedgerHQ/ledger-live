import React from "react";

/**
 * A function to call when the drawer should be opened or closed.
 * @param opened Whether the drawer should be opened or closed.
 */
export type SetDrawerOpenedCallback = (opened: boolean) => void;

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
   * @param setDrawerOpenedCallback The callback to call when the drawer should be opened or closed.
   * @param force If true, the drawer will be opened immediately and all other drawers in the queue will be closed and removed from the queue.
   * @returns An object with methods to remove the drawer from the queue and get its position in the queue.
   */
  addDrawerToQueue: (
    setDrawerOpenedCallback: SetDrawerOpenedCallback,
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

const defaultContextValue: QueuedDrawersContextType = {
  addDrawerToQueue: () => ({
    removeDrawerFromQueue: () => {
      throw new Error("removeDrawerFromQueue not implemented");
    },
    getPositionInQueue: () => {
      throw new Error("getPositionInQueue not implemented");
    },
  }),
  closeAllDrawers: () => {
    throw new Error("closeAllDrawers not implemented");
  },
  _clearQueueDIRTYDONOTUSE: () => {
    throw new Error("_clearQueueDIRTYDONOTUSE not implemented");
  },
};

export const QueuedDrawersContext =
  React.createContext<QueuedDrawersContextType>(defaultContextValue);
